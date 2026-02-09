"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MainModule, MjData, MjModel } from "mujoco-js/dist/mujoco_wasm";
import { Reflector } from "@/lib/reflector";

const SCENE_XML_URL = 
  "/demo/scene.xml";
  // "https://raw.githubusercontent.com/google-deepmind/mujoco_menagerie/main/unitree_g1/scene_with_hands.xml";

const ASSET_BASE_URL =
  "https://raw.githubusercontent.com/google-deepmind/mujoco_menagerie/main/unitree_g1/";

const MUJOCO_WASM_URL =
  "https://unpkg.com/mujoco-js@0.0.7/dist/mujoco_wasm.js";

type MujocoModule = Pick<
  MainModule,
  "FS" | "MEMFS" | "MjModel" | "MjData" | "mjtGeom" | "mj_step" | "mj_resetData"
>;

type ThreeBundle = {
  THREE: typeof import("three");
  OrbitControls: typeof import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;
  Reflector: typeof Reflector;
};

const getPosition = (
  buffer: Float32Array,
  index: number,
  target: import("three").Vector3,
  swizzle = true
) => {
  if (swizzle) {
    return target.set(buffer[index * 3], buffer[index * 3 + 2], -buffer[index * 3 + 1]);
  }
  return target.set(buffer[index * 3], buffer[index * 3 + 1], buffer[index * 3 + 2]);
};

const getQuaternion = (
  buffer: Float32Array,
  index: number,
  target: import("three").Quaternion,
  swizzle = true
) => {
  if (swizzle) {
    return target.set(
      -buffer[index * 4 + 1],
      -buffer[index * 4 + 3],
      buffer[index * 4 + 2],
      -buffer[index * 4 + 0]
    );
  }
  return target.set(
    buffer[index * 4 + 0],
    buffer[index * 4 + 1],
    buffer[index * 4 + 2],
    buffer[index * 4 + 3]
  );
};

const swizzleVector = (vector: import("three").Vector3, target: import("three").Vector3) =>
  target.set(vector.x, vector.z, -vector.y);

const CAMERA_ASPECT = 4 / 3;

const getNameFromTable = (table: Uint8Array | undefined, addr: number) => {
  if (!table || addr < 0 || addr >= table.length) return "";
  let end = addr;
  while (end < table.length && table[end] !== 0) end += 1;
  return new TextDecoder().decode(table.subarray(addr, end));
};

type CompilerDirs = {
  meshdir?: string;
  texturedir?: string;
  assetdir?: string;
};

const resolveAssetUrl = (baseUrl: string, relPath: string) => `${baseUrl}${relPath}`;

const fetchAssetWithFallback = async (baseUrl: string, relPath: string) => {
  const candidates = [resolveAssetUrl(baseUrl, relPath)];
  if (!relPath.includes("/")) {
    candidates.push(resolveAssetUrl(baseUrl, `assets/${relPath}`));
  }
  for (const url of candidates) {
    const res = await fetch(url);
    if (res.ok) return { url, response: res };
  }
  const lastUrl = candidates[candidates.length - 1];
  const lastRes = await fetch(lastUrl);
  return { url: lastUrl, response: lastRes };
};

const getIncludeBaseUrl = (xmlUrl: string) => {
  try {
    const url = new URL(xmlUrl, window.location.origin);
    const parts = url.pathname.split("/");
    parts.pop();
    return `${url.origin}${parts.join("/")}/`;
  } catch {
    return ASSET_BASE_URL;
  }
};

const resolveRelativePath = (basePath: string, refPath: string) => {
  if (refPath.startsWith("/")) {
    refPath = refPath.slice(1);
  }
  if (refPath.startsWith("http://") || refPath.startsWith("https://")) {
    return refPath;
  }
  const baseDir = basePath.split("/").slice(0, -1);
  const parts = [...baseDir, ...refPath.split("/")];
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join("/");
};

const parseCompilerDirs = (xmlText: string): CompilerDirs => {
  const dirs: CompilerDirs = {};
  const match = xmlText.match(/<compiler[^>]*>/);
  if (!match) return dirs;
  const tag = match[0];
  const meshdir = tag.match(/meshdir="([^"]+)"/);
  const texturedir = tag.match(/texturedir="([^"]+)"/);
  const assetdir = tag.match(/assetdir="([^"]+)"/);
  if (meshdir) dirs.meshdir = meshdir[1].replace(/^\/+/, "");
  if (texturedir) dirs.texturedir = texturedir[1].replace(/^\/+/, "");
  if (assetdir) dirs.assetdir = assetdir[1].replace(/^\/+/, "");
  return dirs;
};

const resolveAssetPath = (basePath: string, refPath: string, dirs: CompilerDirs) => {
  if (refPath.startsWith("http://") || refPath.startsWith("https://")) {
    return refPath;
  }
  const ext = refPath.split(".").pop()?.toLowerCase() || "";
  const isMesh = ["stl", "obj", "mesh", "msh", "ply"].includes(ext);
  const isTexture = ["png", "jpg", "jpeg", "bmp", "tga"].includes(ext);

  if (!refPath.includes("/")) {
    if (isMesh && dirs.meshdir) {
      refPath = `${dirs.meshdir}/${refPath}`;
    } else if (isTexture && dirs.texturedir) {
      refPath = `${dirs.texturedir}/${refPath}`;
    } else if (dirs.assetdir) {
      refPath = `${dirs.assetdir}/${refPath}`;
    }
  }
  return resolveRelativePath(basePath, refPath);
};

const extractAssetPaths = (xmlText: string) => {
  const assetPaths = new Set<string>();
  const includePaths = new Set<string>();
  const regex = /file="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xmlText)) !== null) {
    const path = match[1];
    if (path.startsWith("http://") || path.startsWith("https://")) continue;
    if (path.endsWith(".xml")) {
      includePaths.add(path);
    } else {
      assetPaths.add(path);
    }
  }
  return { assetPaths: Array.from(assetPaths), includePaths: Array.from(includePaths) };
};

const ensureDir = (mujoco: MujocoModule, filePath: string) => {
  const parts = filePath.split("/").slice(0, -1);
  let current = "";
  for (const part of parts) {
    if (!part) continue;
    current += `/${part}`;
    try {
      mujoco.FS.mkdir(current);
    } catch {
      // Ignore if it already exists.
    }
  }
};

const isBinaryAsset = (path: string) => {
  const lower = path.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".stl") ||
    lower.endsWith(".skn")
  );
};

export default function DemoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mujocoRef = useRef<MujocoModule | null>(null);
  const modelRef = useRef<MjModel | null>(null);
  const dataRef = useRef<MjData | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef<boolean>(false);
  const lastUiUpdateRef = useRef<number>(0);
  const threeRef = useRef<ThreeBundle | null>(null);
  const rendererRef = useRef<import("three").WebGLRenderer | null>(null);
  const cameraRendererRef = useRef<import("three").WebGLRenderer | null>(null);
  const sceneRef = useRef<import("three").Scene | null>(null);
  const cameraRef = useRef<import("three").PerspectiveCamera | null>(null);
  const mujocoCameraRef = useRef<import("three").PerspectiveCamera | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<import("three/examples/jsm/controls/OrbitControls.js").OrbitControls | null>(
    null
  );
  const meshesRef = useRef<Array<import("three").Object3D | null>>([]);
  const bodiesRef = useRef<Array<import("three").Group | null>>([]);
  const rootRef = useRef<import("three").Group | null>(null);
  const lightsRef = useRef<Array<import("three").Light | null>>([]);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  const [status, setStatus] = useState("Loading MuJoCo WASM…");
  const [running, setRunning] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [bodyCount, setBodyCount] = useState(0);
  const [cameraCount, setCameraCount] = useState(0);
  const [cameraNames, setCameraNames] = useState<string[]>([]);
  const [selectedCamera, setSelectedCamera] = useState(0);
  const selectedCameraRef = useRef(0);
  const mainRef = useRef<HTMLElement>(null);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);
  const sceneWrapRef = useRef<HTMLDivElement>(null);
  const cameraWrapRef = useRef<HTMLDivElement>(null);
  const [cameraViewportSize, setCameraViewportSize] = useState({ width: 0, height: 0 });


  const getCameraNames = useCallback((model: MjModel) => {
    const names: string[] = [];
    const count = model.ncam ?? 0;
    for (let i = 0; i < count; i += 1) {
      const addr = model.name_camadr?.[i] ?? -1;
      const name = addr >= 0 ? getNameFromTable(model.names, addr) : "";
      names.push(name || `Camera ${i + 1}`);
    }
    return names;
  }, []);

  const updateMujocoCamera = useCallback((
    THREE: typeof import("three"),
    model: MjModel,
    data: MjData,
    index: number,
    camera: import("three").PerspectiveCamera
  ) => {
    if (!data.cam_xpos || !data.cam_xmat) return;
    const pos = new THREE.Vector3();
    getPosition(data.cam_xpos, index, pos);
    const base = index * 9;
    // cam_xmat is row-major 3x3; columns are camera axes in world coords.
    const mujoUp = new THREE.Vector3(
      data.cam_xmat[base + 1],
      data.cam_xmat[base + 4],
      data.cam_xmat[base + 7]
    );
    const mujoZ = new THREE.Vector3(
      data.cam_xmat[base + 2],
      data.cam_xmat[base + 5],
      data.cam_xmat[base + 8]
    );
    const forward = swizzleVector(mujoZ.multiplyScalar(-1), new THREE.Vector3());
    const up = swizzleVector(mujoUp, new THREE.Vector3());
    camera.position.copy(pos);
    camera.up.copy(up);
    camera.lookAt(pos.clone().add(forward));

    if (model.cam_fovy && model.cam_fovy[index]) {
      camera.fov = model.cam_fovy[index];
      camera.updateProjectionMatrix();
    }
  }, []);

  const mujocoType = useCallback((name: keyof MujocoModule["mjtGeom"]) => {
    const mujoco = mujocoRef.current;
    if (!mujoco) return -1;
    const entry = mujoco.mjtGeom[name];
    return typeof entry === "number" ? entry : entry.value;
  }, []);

  const createGeomMeshes = useCallback((
    THREE: typeof import("three"),
    ReflectorCtor: typeof Reflector,
    model: MjModel,
    scene: import("three").Scene
  ) => {
    const meshes: Array<import("three").Object3D | null> = new Array(model.ngeom).fill(null);
    const bodies: Array<import("three").Group | null> = new Array(model.nbody).fill(null);
    const root = new THREE.Group();
    root.name = "MuJoCo Root";
    scene.add(root);
    const geomType = model.geom_type;
    const geomGroup = model.geom_group;
    const geomSize = model.geom_size;
    const geomRgba = model.geom_rgba;
    const geomMatId = model.geom_matid;
    const matRgba = model.mat_rgba;
    const matTexId = model.mat_texid;
    const matTexRepeat = model.mat_texrepeat;
    const matSpecular = model.mat_specular;
    const matReflectance = model.mat_reflectance;
    const matShininess = model.mat_shininess;
    const matMetallic = model.mat_metallic;
    const texWidth = model.tex_width;
    const texHeight = model.tex_height;
    const texAdr = model.tex_adr;
    const texNChannel = model.tex_nchannel;
    const texData = model.tex_data;
    const geomDataId = model.geom_dataid;
    const meshCache = new Map<number, import("three").BufferGeometry>();

    for (let i = 0; i < model.ngeom; i += 1) {
      if (geomGroup && geomGroup.length === model.ngeom && geomGroup[i] >= 3) {
        continue;
      }
      const type = geomType[i];
      let rgba = geomRgba.subarray(i * 4, i * 4 + 4);
      const matId = geomMatId?.[i] ?? -1;
      if (matId >= 0 && matRgba && matRgba.length >= (matId + 1) * 4) {
        rgba = matRgba.subarray(matId * 4, matId * 4 + 4);
      }
      const alpha = rgba[3] > 1 ? rgba[3] / 255 : rgba[3];
      if (alpha === 0) continue;
      const bodyId = model.geom_bodyid[i];

      if (!bodies[bodyId]) {
        bodies[bodyId] = new THREE.Group();
        bodies[bodyId]!.name = `body-${bodyId}`;
      }

      const color = new THREE.Color(rgba[0], rgba[1], rgba[2]);
      let texture: import("three").DataTexture | undefined;
      if (matId >= 0 && matTexId && texWidth && texHeight && texAdr && texNChannel && texData) {
        const mjNTEXROLE = 10;
        const mjTEXROLE_RGB = 1;
        const texId = matTexId[(matId * mjNTEXROLE) + mjTEXROLE_RGB];
        if (texId >= 0) {
          const width = texWidth[texId];
          const height = texHeight[texId];
          const offset = texAdr[texId];
          const channels = texNChannel[texId];
          const rgbaArray = new Uint8Array(width * height * 4);
          for (let p = 0; p < width * height; p += 1) {
            rgbaArray[p * 4] = texData[offset + p * channels];
            rgbaArray[p * 4 + 1] =
              channels > 1 ? texData[offset + p * channels + 1] : rgbaArray[p * 4];
            rgbaArray[p * 4 + 2] =
              channels > 2 ? texData[offset + p * channels + 2] : rgbaArray[p * 4];
            rgbaArray[p * 4 + 3] = channels > 3 ? texData[offset + p * channels + 3] : 255;
          }
          texture = new THREE.DataTexture(rgbaArray, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
          if (texId === 2) {
            texture.repeat = new THREE.Vector2(50, 50);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestMipMapNearestFilter;
          } else if (matTexRepeat) {
            texture.repeat = new THREE.Vector2(matTexRepeat[matId * 2], matTexRepeat[matId * 2 + 1]);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
          }
          texture.needsUpdate = true;
        }
      }

      const material = new THREE.MeshPhysicalMaterial({
        color,
        transparent: alpha < 1,
        opacity: Math.min(1, Math.max(0, alpha)),
        specularIntensity: matId >= 0 && matSpecular ? matSpecular[matId] : undefined,
        reflectivity: matId >= 0 && matReflectance ? matReflectance[matId] : undefined,
        roughness: matId >= 0 && matShininess ? 1.0 - matShininess[matId] : undefined,
        metalness: matId >= 0 && matMetallic ? 0.1 : undefined,
        map: texture,
      });

      const size = geomSize.subarray(i * 3, i * 3 + 3);
      let geometry: import("three").BufferGeometry | null = null;

      switch (type) {
        case mujocoType("mjGEOM_SPHERE"):
          geometry = new THREE.SphereGeometry(size[0], 24, 16);
          break;
        case mujocoType("mjGEOM_BOX"):
          geometry = new THREE.BoxGeometry(size[0] * 2, size[2] * 2, size[1] * 2);
          break;
        case mujocoType("mjGEOM_CYLINDER"): {
          geometry = new THREE.CylinderGeometry(size[0], size[0], size[1] * 2, 20, 1);
          break;
        }
        case mujocoType("mjGEOM_CAPSULE"): {
          geometry = new THREE.CapsuleGeometry(size[0], size[1] * 2, 20, 20);
          break;
        }
        case mujocoType("mjGEOM_ELLIPSOID"): {
          geometry = new THREE.SphereGeometry(1, 24, 16);
          break;
        }
        case mujocoType("mjGEOM_PLANE"):
          break;
        case mujocoType("mjGEOM_MESH"): {
          const meshId = geomDataId[i];
          if (meshId < 0 || meshId >= model.nmesh) break;
          if (meshCache.has(meshId)) {
            geometry = meshCache.get(meshId) || null;
            break;
          }
          const vertAdr = model.mesh_vertadr[meshId];
          const vertNum = model.mesh_vertnum[meshId];
          const faceAdr = model.mesh_faceadr[meshId];
          const faceNum = model.mesh_facenum[meshId];
          if (vertNum <= 0 || faceNum <= 0) break;

          const positions = new Float32Array(vertNum * 3);
          const srcVerts = model.mesh_vert.subarray(vertAdr * 3, vertAdr * 3 + vertNum * 3);
          for (let v = 0; v < vertNum; v += 1) {
            const vx = srcVerts[v * 3];
            const vy = srcVerts[v * 3 + 1];
            const vz = srcVerts[v * 3 + 2];
            positions[v * 3] = vx;
            positions[v * 3 + 1] = vz;
            positions[v * 3 + 2] = -vy;
          }

          const index = new Uint32Array(faceNum * 3);
          const srcFaces = model.mesh_face.subarray(faceAdr * 3, faceAdr * 3 + faceNum * 3);
          index.set(srcFaces);

          const meshGeom = new THREE.BufferGeometry();
          meshGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          meshGeom.setIndex(new THREE.BufferAttribute(index, 1));
          meshGeom.computeVertexNormals();
          geometry = meshGeom;
          meshCache.set(meshId, meshGeom);
          break;
        }
        default:
          geometry = null;
      }

      if (type === mujocoType("mjGEOM_PLANE")) {
        const reflector = new ReflectorCtor(new THREE.PlaneGeometry(100, 100), {
          clipBias: 0.003,
          textureWidth: 1024,
          textureHeight: 1024,
          color: 0x6a6f7a,
          texture,
        });
        reflector.rotateX(-Math.PI / 2);
        reflector.castShadow = false;
        reflector.receiveShadow = true;
        bodies[bodyId]!.add(reflector);
      meshes[i] = reflector;
      continue;
      }

      if (!geometry) continue;

      const mesh = new THREE.Mesh(geometry, material);
      if (type === mujocoType("mjGEOM_ELLIPSOID")) {
        mesh.scale.set(size[0], size[2], size[1]);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = type !== mujocoType("mjGEOM_MESH");
      bodies[bodyId]!.add(mesh);
      getPosition(model.geom_pos, i, mesh.position);
      if (type !== mujocoType("mjGEOM_PLANE")) {
        getQuaternion(model.geom_quat, i, mesh.quaternion);
      }
      meshes[i] = mesh;
    }

    const lights: Array<import("three").Light | null> = new Array(model.nlight).fill(null);
    for (let l = 0; l < model.nlight; l += 1) {
      let light: import("three").Light;
      if (model.light_type[l] === 0) {
        const spot = new THREE.SpotLight();
        spot.angle = 1.51;
        light = spot;
      } else if (model.light_type[l] === 1) {
        light = new THREE.DirectionalLight();
      } else if (model.light_type[l] === 2) {
        light = new THREE.PointLight();
      } else {
        light = new THREE.HemisphereLight();
      }

      if (light instanceof THREE.SpotLight) {
        light.angle = 1.11;
        light.penumbra = 0.5;
      }
      if (light instanceof THREE.PointLight) {
        light.decay = model.light_attenuation[l] * 100;
      }
      light.castShadow = true;
      light.intensity = light.intensity * Math.PI * 1.0;
      const shadow = "shadow" in light ? (light as { shadow?: import("three").LightShadow }).shadow : undefined;
      if (shadow) {
        shadow.mapSize.width = 1024;
        shadow.mapSize.height = 1024;
        if (
          shadow.camera instanceof THREE.PerspectiveCamera ||
          shadow.camera instanceof THREE.OrthographicCamera
        ) {
          shadow.camera.near = 0.1;
          shadow.camera.far = 10;
        }
      }

      if (bodies[0]) {
        bodies[0]!.add(light);
      } else {
        root.add(light);
      }
      lights[l] = light;
    }
    if (model.nlight === 0) {
      const light = new THREE.DirectionalLight();
      root.add(light);
    }

    for (let b = 0; b < bodies.length; b += 1) {
      if (!bodies[b]) continue;
      if (b === 0) {
        root.add(bodies[b]!);
      } else {
        root.add(bodies[b]!);
      }
    }

    bodiesRef.current = bodies;
    rootRef.current = root;
    lightsRef.current = lights;
    return meshes;
  }, [mujocoType]);

  const updateBodies = useCallback((model: MjModel, data: MjData) => {
    const bodies = bodiesRef.current;
    if (!bodies.length) return;
    for (let b = 0; b < model.nbody; b += 1) {
      const body = bodies[b];
      if (!body) continue;
      getPosition(data.xpos, b, body.position);
      getQuaternion(data.xquat, b, body.quaternion);
      body.updateMatrixWorld();
    }
  }, []);

  const updateLights = useCallback((model: MjModel, data: MjData) => {
    const lights = lightsRef.current;
    const three = threeRef.current;
    if (!three) return;
    if (!lights.length) return;
    for (let l = 0; l < model.nlight; l += 1) {
      const light = lights[l];
      if (!light) continue;
      getPosition(data.light_xpos, l, light.position);
      const target = new three.THREE.Vector3();
      getPosition(data.light_xdir, l, target);
      light.lookAt(target.add(light.position));
    }
  }, []);

  const downloadAssetsToFS = useCallback(async (
    mujoco: MujocoModule,
    rootXmlFile: string,
    rootXmlText: string,
    assetBaseUrl: string,
    includeBaseUrl: string
  ) => {
    const pending = new Map<string, { text: string; dirs: CompilerDirs }>();
    pending.set(rootXmlFile, { text: rootXmlText, dirs: parseCompilerDirs(rootXmlText) });

    const seen = new Set<string>();
    while (pending.size > 0) {
      const [xmlPath, payload] = pending.entries().next().value as [
        string,
        { text: string; dirs: CompilerDirs }
      ];
      const xmlText = payload.text;
      const currentDirs = { ...payload.dirs, ...parseCompilerDirs(xmlText) };
      pending.delete(xmlPath);
      if (!seen.has(xmlPath)) {
        const xmlTargetPath = `/working/${xmlPath}`;
        ensureDir(mujoco, xmlTargetPath);
        mujoco.FS.writeFile(xmlTargetPath, xmlText);
        seen.add(xmlPath);
      }

      const { assetPaths, includePaths } = extractAssetPaths(xmlText);
      for (const includePath of includePaths) {
        const resolvedInclude = resolveRelativePath(xmlPath, includePath);
        if (seen.has(resolvedInclude) || pending.has(resolvedInclude)) continue;
        const includeUrl = resolveAssetUrl(includeBaseUrl, resolvedInclude);
        const includeRes = await fetch(includeUrl);
        if (!includeRes.ok) {
          throw new Error(`Failed to fetch include ${includeUrl}: ${includeRes.status}`);
        }
        const includeText = await includeRes.text();
        pending.set(resolvedInclude, { text: includeText, dirs: currentDirs });
      }

      for (const relPath of assetPaths) {
        const resolvedAsset = resolveAssetPath(xmlPath, relPath, currentDirs);
        if (seen.has(resolvedAsset)) continue;
        const { url, response } = await fetchAssetWithFallback(assetBaseUrl, resolvedAsset);
        const targetPath = `/working/${resolvedAsset}`;
        ensureDir(mujoco, targetPath);
        const isBinary = isBinaryAsset(resolvedAsset);
        if (!response.ok) {
          throw new Error(`Failed to fetch asset ${url}: ${response.status}`);
        }
        if (isBinary) {
          const buffer = await response.arrayBuffer();
          mujoco.FS.writeFile(targetPath, new Uint8Array(buffer));
        } else {
          const text = await response.text();
          mujoco.FS.writeFile(targetPath, text);
        }
        seen.add(resolvedAsset);
      }
    }
  }, []);

  

  const initThreeScene = useCallback((model: MjModel) => {
    const canvas = canvasRef.current;
    const three = threeRef.current;
    const cameraCanvas = cameraCanvasRef.current;
    if (!canvas || !three) return;

    const { THREE, OrbitControls, Reflector } = three;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(1.0);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    THREE.ColorManagement.enabled = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0.15, 0.25, 0.35);
    scene.fog = new THREE.Fog(scene.background, 15, 25.5);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.001, 100);
    camera.position.set(2.0, 1.7, 1.7);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 0.7, 0);
    controls.panSpeed = 2;
    controls.zoomSpeed = 1;
    controls.screenSpacePanning = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1 * Math.PI);
    scene.add(ambientLight);

    const spotlight = new THREE.SpotLight();
    spotlight.angle = 1.11;
    spotlight.distance = 10000;
    spotlight.penumbra = 0.5;
    spotlight.castShadow = true;
    spotlight.intensity = spotlight.intensity * Math.PI * 10.0;
    spotlight.shadow.mapSize.width = 1024;
    spotlight.shadow.mapSize.height = 1024;
    spotlight.shadow.camera.near = 0.1;
    spotlight.shadow.camera.far = 100;
    spotlight.position.set(0, 3, 3);
    const targetObject = new THREE.Object3D();
    scene.add(targetObject);
    spotlight.target = targetObject;
    targetObject.position.set(0, 1, 0);
    scene.add(spotlight);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;

    if (cameraCanvas) {
      const cameraRenderer = new THREE.WebGLRenderer({ canvas: cameraCanvas, antialias: true });
      cameraRenderer.setPixelRatio(1.0);
      cameraRenderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      cameraRenderer.shadowMap.enabled = true;
      cameraRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
      const mujocoCamera = new THREE.PerspectiveCamera(60, 1, 0.001, 100);

      cameraRendererRef.current = cameraRenderer;
      mujocoCameraRef.current = mujocoCamera;
    }

    meshesRef.current = createGeomMeshes(THREE, Reflector, model, scene);

    const onResize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();

      if (cameraWrapRef.current && cameraRendererRef.current && mujocoCameraRef.current) {
        const wrapWidth = cameraWrapRef.current.clientWidth;
        const wrapHeight = cameraWrapRef.current.clientHeight;
        const renderWidth = Math.min(wrapWidth, wrapHeight * CAMERA_ASPECT);
        const renderHeight = renderWidth / CAMERA_ASPECT;
        setCameraViewportSize({ width: renderWidth, height: renderHeight });
        cameraRendererRef.current.setSize(renderWidth, renderHeight, false);
        mujocoCameraRef.current.aspect = renderWidth / Math.max(renderHeight, 1);
        mujocoCameraRef.current.updateProjectionMatrix();
      }
    };

    onResize();
    resizeHandlerRef.current = onResize;
    window.addEventListener("resize", onResize);

    renderer.info.autoReset = true;
  }, [createGeomMeshes]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    selectedCameraRef.current = selectedCamera;
  }, [selectedCamera]);

  useLayoutEffect(() => {
    const updateAvailableHeight = () => {
      const nav = document.body.firstElementChild as HTMLElement | null;
      const footer = document.querySelector("footer") as HTMLElement | null;
      const navHeight = nav?.getBoundingClientRect().height ?? 0;
      const footerHeight = footer?.getBoundingClientRect().height ?? 0;
      let padding = 0;
      if (mainRef.current) {
        const styles = window.getComputedStyle(mainRef.current);
        padding =
          (Number.parseFloat(styles.paddingTop) || 0) +
          (Number.parseFloat(styles.paddingBottom) || 0);
      }
      const nextHeight = Math.max(0, window.innerHeight - navHeight - footerHeight - padding);
      setAvailableHeight(nextHeight);
    };

    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);
    return () => window.removeEventListener("resize", updateAvailableHeight);
  }, []);

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      resizeHandlerRef.current?.();
    });
    if (sceneWrapRef.current) resizeObserver.observe(sceneWrapRef.current);
    if (cameraWrapRef.current) resizeObserver.observe(cameraWrapRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setStatus("Loading MuJoCo module…");
        const [{ default: loadMujoco }, THREE, { OrbitControls }] = await Promise.all([
          import(/* webpackIgnore: true */ MUJOCO_WASM_URL),
          import("three"),
          import("three/examples/jsm/controls/OrbitControls.js"),
        ]);
        const mujoco = await loadMujoco();

        if (cancelled) return;

        threeRef.current = { THREE, OrbitControls, Reflector };
        mujocoRef.current = mujoco;

        try {
          mujoco.FS.mkdir("/working");
          mujoco.FS.mount(mujoco.MEMFS, { root: "." }, "/working");
        } catch {
          // Ignore if already mounted.
        }

        setStatus("Fetching humanoid model…");
        const xmlUrl = SCENE_XML_URL;
        const xmlText = await fetch(xmlUrl).then((res) => res.text());
        if (cancelled) return;

        const xmlFilename = xmlUrl.split("/").pop() || "scene.xml";
        const rootXmlPath = `/working/${xmlFilename}`;
        mujoco.FS.writeFile(rootXmlPath, xmlText);
        setStatus("Downloading MuJoCo WASM assets…");
        const includeBaseUrl = getIncludeBaseUrl(xmlUrl);
        await downloadAssetsToFS(mujoco, xmlFilename, xmlText, ASSET_BASE_URL, includeBaseUrl);
        if (cancelled) return;
        const model = mujoco.MjModel.loadFromXML(rootXmlPath);
        const data = new mujoco.MjData(model);

        modelRef.current = model;
        dataRef.current = data;

        initThreeScene(model);

        setBodyCount(model.nbody);
        setCameraCount(model.ncam ?? 0);
        setCameraNames(getCameraNames(model));
        setSelectedCamera(0);
        setSimTime(0);
        setRunning(true);
        setStatus("Running");

        renderLoop();
      } catch (err) {
        setStatus(`Failed to initialize: ${String(err)}`);
      }
    };

    const renderLoop = () => {
      const mujoco = mujocoRef.current;
      const model = modelRef.current;
      const data = dataRef.current;
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      const cameraRenderer = cameraRendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const mujocoCamera = mujocoCameraRef.current;
      const controls = controlsRef.current;

      if (!mujoco || !model || !data || !canvas || !renderer || !scene || !camera) return;

      if (runningRef.current) {
        for (let i = 0; i < 4; i += 1) {
          mujoco.mj_step(model, data);
        }
      }

      updateBodies(model, data);
      updateLights(model, data);
      controls?.update();
      renderer.render(scene, camera);
      if (cameraRenderer && mujocoCamera && model.ncam > 0) {
        const cameraIndex = Math.min(
          Math.max(0, selectedCameraRef.current),
          Math.max(0, model.ncam - 1)
        );
        updateMujocoCamera(threeRef.current!.THREE, model, data, cameraIndex, mujocoCamera);
        cameraRenderer.render(scene, mujocoCamera);
      }
      if (data.time - lastUiUpdateRef.current > 0.1) {
        lastUiUpdateRef.current = data.time;
        setSimTime(data.time);
      }

      rafRef.current = window.requestAnimationFrame(renderLoop);
    };

    init();

    return () => {
      cancelled = true;
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
      }
      dataRef.current?.delete();
      modelRef.current?.delete();
      controlsRef.current?.dispose();
      rendererRef.current?.dispose();
      cameraRendererRef.current?.dispose();
    };
  }, [downloadAssetsToFS, getCameraNames, initThreeScene, updateBodies, updateLights, updateMujocoCamera]);

  const onReset = () => {
    const mujoco = mujocoRef.current;
    const model = modelRef.current;
    const data = dataRef.current;
    if (!mujoco || !model || !data) return;
    mujoco.mj_resetData(model, data);
    setSimTime(0);
  };

  return (
    <main ref={mainRef} className="mx-auto flex w-full max-w-7xl flex-col px-6 py-6">
      <section
        className="flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm"
        style={availableHeight ? { height: availableHeight } : undefined}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 px-5 py-3">
          <div className="text-sm text-neutral-600">
            Status: <span className="font-medium text-neutral-900">{status}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <span>t = {simTime.toFixed(2)}s</span>
            <span>{bodyCount} bodies</span>
            <span>{cameraCount} cameras</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRunning((prev) => !prev)}
              className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
            >
              {running ? "Pause" : "Run"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 py-4">
          <div className="flex flex-1 flex-col gap-4 lg:flex-row">
            <div
              ref={sceneWrapRef}
              className="relative flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 lg:flex-[2]"
            >
              <canvas ref={canvasRef} className="h-full w-full" />
            </div>
            <div
              ref={cameraWrapRef}
              className="relative flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 lg:flex-[1]"
            >
              <div className="absolute left-4 top-4 z-10 rounded-full bg-white/80 px-3 py-1 text-xs text-neutral-700 shadow-sm">
                Model camera
              </div>
              <div className="flex h-full w-full items-center justify-center">
                <canvas
                  ref={cameraCanvasRef}
                  style={{
                    width: cameraViewportSize.width || undefined,
                    height: cameraViewportSize.height || undefined,
                  }}
                />
              </div>
            </div>
          </div>
          {cameraCount > 1 && (
            <div className="mt-4 flex items-center gap-2 text-xs text-neutral-600">
              <span>Camera:</span>
              <select
                value={selectedCamera}
                onChange={(event) => setSelectedCamera(Number(event.target.value))}
                className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-800"
              >
                {cameraNames.map((name, index) => (
                  <option key={`${name}-${index}`} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
