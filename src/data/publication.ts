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
    year: "2019",
    conference: "CoRL",
    title: "Iterative Reinforcement Learning Based Design of Dynamic Locomotion Skills for Cassie",
    authors: "Zhaoming Xie, Patrick Clary, Jeremy Dao, Pedro Morais, Jonathan Hurst, Michiel van de Panne",
    paperUrl: "https://arxiv.org/abs/1903.09537",
    imageUrl: "/images/corl2019/cassie.gif",
    // codeUrl: "https://github.com/jsmith/robust-causal-discovery",
  },
  {
    year: "2018",
    conference: "ICAPS",
    title: "Monte-Carlo Planning for Agile Biped Locomotion",
    authors: "Patrick Clary, Pedro Morais, Alan Fern, Jonathan Hurst",
    paperUrl: "https://web.engr.oregonstate.edu/~afern/papers/icaps18-clary.pdf",
    // codeUrl: "https://github.com/jsmith/scalable-causal-discovery",
    //bibtex: "https://arxiv.org/abs/2409.15476.bib",
    // tldr: "Using causal discovery to find the causal structure of high-dimensional time series data.",
    imageUrl: "/images/mcds/pclary2018.jpg",
    // award: "🏆 Best Paper Award",
    // if you have an image in public/images, you can use it like this:
    // imageUrl: "/images/publication-image.jpg"
  },
];
