/*
 * This file is derived from the mujoco_wasm project by zalo.
 * Source: https://github.com/zalo/mujoco_wasm (MIT License)
 * Modifications: TypeScript typing + formatting for this codebase.
 */

import {
  Color,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  NoToneMapping,
  PerspectiveCamera,
  Plane,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  HalfFloatType,
  LinearSRGBColorSpace,
  type BufferGeometry,
} from "three";

type ReflectorShader = {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
};

type ReflectorOptions = {
  color?: number;
  textureWidth?: number;
  textureHeight?: number;
  clipBias?: number;
  multisample?: number;
  texture?: MeshPhysicalMaterial["map"];
};

export class Reflector extends Mesh {
  declare camera: PerspectiveCamera;
  declare isReflector: boolean;
  private renderTarget: WebGLRenderTarget;
  private reflectorMaterial: MeshPhysicalMaterial & {
    uniforms: Record<string, { value: unknown }>;
    userData: Record<string, unknown>;
  };

  constructor(geometry: BufferGeometry, options: ReflectorOptions = {}) {
    super(geometry);

    this.isReflector = true;
    this.camera = new PerspectiveCamera();

    const color = options.color !== undefined ? new Color(options.color) : new Color(0x7f7f7f);
    const textureWidth = options.textureWidth || 1024;
    const textureHeight = options.textureHeight || 1024;
    const clipBias = options.clipBias || 0;
    const multisample = options.multisample !== undefined ? options.multisample : 4;
    const blendTexture = options.texture;

    const reflectorPlane = new Plane();
    const normal = new Vector3();
    const reflectorWorldPosition = new Vector3();
    const cameraWorldPosition = new Vector3();
    const rotationMatrix = new Matrix4();
    const lookAtPosition = new Vector3(0, 0, -1);
    const clipPlane = new Vector4();

    const view = new Vector3();
    const target = new Vector3();
    const q = new Vector4();

    const textureMatrix = new Matrix4();
    const virtualCamera = this.camera;

    this.renderTarget = new WebGLRenderTarget(textureWidth, textureHeight, {
      samples: multisample,
      type: HalfFloatType,
    });

    this.reflectorMaterial = new MeshPhysicalMaterial({ map: blendTexture, color }) as MeshPhysicalMaterial & {
      uniforms: Record<string, { value: unknown }>;
      userData: Record<string, unknown>;
    };
    this.reflectorMaterial.uniforms = {
      tDiffuse: { value: this.renderTarget.texture },
      textureMatrix: { value: textureMatrix },
    };
    this.material = this.reflectorMaterial;

    this.material.onBeforeCompile = (shader: ReflectorShader) => {
      const bodyStart = shader.vertexShader.indexOf("void main() {");
      shader.vertexShader =
        shader.vertexShader.slice(0, bodyStart) +
        "\nuniform mat4 textureMatrix;\nvarying vec4 vUv3;\n" +
        shader.vertexShader.slice(bodyStart - 1, -1) +
        "	vUv3 = textureMatrix * vec4( position, 1.0 ); }";

      const fragStart = shader.fragmentShader.indexOf("void main() {");
      shader.fragmentShader =
        "\nuniform sampler2D tDiffuse; \n varying vec4 vUv3;\n" +
        shader.fragmentShader.slice(0, fragStart) +
        shader.fragmentShader.slice(fragStart - 1, -1) +
        "	gl_FragColor = vec4( mix( texture2DProj( tDiffuse,  vUv3 ).rgb, gl_FragColor.rgb , 0.5), 1.0 );\n}";

      shader.uniforms.tDiffuse = { value: this.renderTarget.texture };
      shader.uniforms.textureMatrix = { value: textureMatrix };
      this.reflectorMaterial.uniforms = shader.uniforms;
      this.reflectorMaterial.userData.shader = shader;
    };

    this.receiveShadow = true;

    this.onBeforeRender = (renderer, scene, camera) => {
      reflectorWorldPosition.setFromMatrixPosition(this.matrixWorld);
      cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);

      rotationMatrix.extractRotation(this.matrixWorld);
      normal.set(0, 0, 1);
      normal.applyMatrix4(rotationMatrix);

      view.subVectors(reflectorWorldPosition, cameraWorldPosition);
      if (view.dot(normal) > 0) return;

      view.reflect(normal).negate();
      view.add(reflectorWorldPosition);

      rotationMatrix.extractRotation(camera.matrixWorld);
      lookAtPosition.set(0, 0, -1);
      lookAtPosition.applyMatrix4(rotationMatrix);
      lookAtPosition.add(cameraWorldPosition);

      target.subVectors(reflectorWorldPosition, lookAtPosition);
      target.reflect(normal).negate();
      target.add(reflectorWorldPosition);

      virtualCamera.position.copy(view);
      virtualCamera.up.set(0, 1, 0);
      virtualCamera.up.applyMatrix4(rotationMatrix);
      virtualCamera.up.reflect(normal);
      virtualCamera.lookAt(target);

      const perspectiveCamera = camera as PerspectiveCamera;
      virtualCamera.far = perspectiveCamera.far;

      virtualCamera.updateMatrixWorld();
      virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

      textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);
      textureMatrix.multiply(virtualCamera.projectionMatrix);
      textureMatrix.multiply(virtualCamera.matrixWorldInverse);
      textureMatrix.multiply(this.matrixWorld);

      reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition);
      reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse);

      clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant);

      const projectionMatrix = virtualCamera.projectionMatrix;
      q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
      q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
      q.z = -1.0;
      q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

      clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

      projectionMatrix.elements[2] = clipPlane.x;
      projectionMatrix.elements[6] = clipPlane.y;
      projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
      projectionMatrix.elements[14] = clipPlane.w;

      this.visible = false;

      const currentRenderTarget = renderer.getRenderTarget();
      const currentXrEnabled = renderer.xr.enabled;
      const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
      const currentOutputEncoding = renderer.outputColorSpace;
      const currentToneMapping = renderer.toneMapping;

      renderer.xr.enabled = false;
      renderer.shadowMap.autoUpdate = false;
      renderer.outputColorSpace = LinearSRGBColorSpace;
      renderer.toneMapping = NoToneMapping;

      renderer.setRenderTarget(this.renderTarget);
      renderer.state.buffers.depth.setMask(true);

      if (renderer.autoClear === false) renderer.clear();
      renderer.render(scene, virtualCamera);

      renderer.xr.enabled = currentXrEnabled;
      renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
      renderer.outputColorSpace = currentOutputEncoding;
      renderer.toneMapping = currentToneMapping;

      renderer.setRenderTarget(currentRenderTarget);

      const cameraWithViewport = camera as PerspectiveCamera & { viewport?: Vector4 };
      const viewport = cameraWithViewport.viewport;
      if (viewport !== undefined) {
        renderer.state.viewport(viewport);
      }

      this.visible = true;
    };
  }

  getRenderTarget() {
    return this.renderTarget;
  }

  dispose() {
    this.renderTarget.dispose();
    if (Array.isArray(this.material)) {
      this.material.forEach((material) => material.dispose());
    } else {
      this.material.dispose();
    }
  }
}
