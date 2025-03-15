export interface AboutMe {
  name: string;
  title: string;
  institution: string;
  description: string;
  email: string;
  imageUrl?: string;
  blogUrl?: string;
  cvUrl?: string;
  googleScholarUrl?: string;
  twitterUsername?: string;
  githubUsername?: string;
  linkedinUsername?: string;
  funDescription?: string; // Gets placed in the left sidebar
  secretDescription?: string; // Gets placed in the bottom
  altName?: string;
  institutionUrl?: string;
}

export const aboutMe: AboutMe = {
  name: "Pedro Morais",
  title: "Roboticist",
  institution: "Agility Robotics",
  // Note that links work in the description
  description:
    'I currently work at <a href="https://www.agilityrobotics.com">Agility Robotics</a> as a Robotics Software Engineer. My work at Agility has spanned a variety of topics from manifold optimization, whole body inverse kinematics, reinforcement learning, contact simulation, subsystem modeling and perception simulation. I currently am on the Simulation team. <br><br>Before joining Agility I was an undergrad at Oregon State University where I did research on bipedal locomotion coadvised by <a href="https://engineering.oregonstate.edu/people/jonathan-hurst">Jonathan Hurst</a> and <a href="https://engineering.oregonstate.edu/people/alan-fern">Alan Fern</a>. At OSU I spearheaded the transition of the <a href="https://mime.engineering.oregonstate.edu/research/drl/">Dynamic Robotics Laboratory</a> from a hardware focused research group to a software and controls focused group with some of the earliest sim-to-real reinforcement learning results for bipedal running. <br><br>My interests broadly lie in the intersection of optimization, simulation and end-to-end control of agile and dexterous humanoid robots.',
  email: "autranemorais@gmail.com",
  imageUrl: "/images/profile.jpeg",
  googleScholarUrl: "https://scholar.google.com/citations?user=iicB8nQAAAAJ&hl=en",
  githubUsername: "hyparxis",
  linkedinUsername: "hyparxis",
  twitterUsername: "pnwpedro",
  // blogUrl: "https://",
  // cvUrl: "https://",
  // institutionUrl: "https://www.stanford.edu",
  // altName: "",
  // secretDescription: "I like dogs.",
};
