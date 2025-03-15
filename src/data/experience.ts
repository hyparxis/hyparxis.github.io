export interface Experience {
  date: string;
  title: string;
  company: string;
  description?: string;
  advisor?: string;
  manager?: string;
  companyUrl?: string;
}

export const experienceData: Experience[] = [
  {
    date: "2019 - Present",
    title: "Robotics Software Engineer",
    company: "Agility Robotics",
    description:
      "One of the first 20 employees at Agility Robotics. Currently on the  simulation and innovation teams, previously optimization and controls.",
    companyUrl: "https://agilityrobotics.com",
  },
  {
    date: "2015 - 2019",
    title: "Research Assistant",
    company: "Dynamic Robotics Lab",
    description:
      'Planning and deep reinforcement learning based control for bipedal locomotion.',
    advisor: "Jonathan Hurst, Alan Fern",
    companyUrl: "https://mime.engineering.oregonstate.edu/research/drl/",
  },
];
