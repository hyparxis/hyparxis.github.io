export interface Publication {
  year: string;
  conference: string;
  title: string;
  authors: string;
  paperUrl?: string;
  codeUrl?: string;
  bibtex?: string;
  tldr?: string;
  imageUrl?: string;
  award?: string;
}

export const publicationData: Publication[] = [
  {
    year: "2025",
    conference: "Humanoids (Sim-to-Real Workshop)",
    title: "Towards a Motion Foundation Model: General-Purpose Whole Body Control through Zero-Shot Sim-to-Real Reinforcement Learning",
    authors: "Jonah Siekman, Helei Duan, Pedro Morais, Chris Paxton, Izzy Brand, Yesh Godse, Alan Fern, Pras Velagapudi, Jonathan Hurst",
    paperUrl: "https://drive.google.com/file/d/1btQvRqd5fdbNQ7s9kTakeWzctSeHnr4P/view",
    imageUrl: "/images/humanoids2025/wbc-moving-bricks.gif",
  },
  {
    year: "2019",
    conference: "CoRL",
    title: "Iterative Reinforcement Learning Based Design of Dynamic Locomotion Skills for Cassie",
    authors: "Zhaoming Xie, Patrick Clary, Jeremy Dao, Pedro Morais, Jonathan Hurst, Michiel van de Panne",
    paperUrl: "https://arxiv.org/abs/1903.09537",
    imageUrl: "/images/corl2019/cassie.gif",
    // codeUrl:
    // bibtex:
    // tldr:
    // award:
  },
  {
    year: "2018",
    conference: "ICAPS",
    title: "Monte-Carlo Planning for Agile Biped Locomotion",
    authors: "Patrick Clary, Pedro Morais, Alan Fern, Jonathan Hurst",
    paperUrl: "https://web.engr.oregonstate.edu/~afern/papers/icaps18-clary.pdf",
    imageUrl: "/images/mcds/pclary2018.jpg",
  },
];
