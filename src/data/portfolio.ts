export interface Portfolio {
  title: string;
  description: string;
  technologies?: string[];
  imageUrl?: string;
  projectUrl?: string;
  codeUrl?: string;
}

export const portfolioData: Portfolio[] = [
  // Example entry
  {
    title: "Apex",
    description:
      "A modular pytorch library implementing continuous reinforcement learning algorithms used by the Dynamic Robotics Lab.",
    technologies: ["Python", "PyTorch"],
    imageUrl:
      "https://raw.githubusercontent.com/osudrl/apex/refs/heads/master/img/output.gif",
    codeUrl: "https://github.com/osudrl/apex",
  },
];
