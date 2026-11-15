// ====== EDIT THIS FILE ======
// Studio details
const STUDIO = {
  name: "Your Studio Name",
  tagline: "Small team. Weird games.",
  about: "We're a small indie studio making games we'd want to play. Write a few sentences about who you are and what you make here.",
  itch: "https://yourname.itch.io",       // your itch.io profile
  contact: "hello@yourstudio.com",
  socials: [
    { label: "itch.io", url: "https://yourname.itch.io" },
    { label: "YouTube", url: "https://youtube.com/" },
    { label: "Discord", url: "https://discord.gg/" }
  ]
};

// One entry per game. Add a poster at images/<slug>.png (or change "poster").
// To add a game: copy a block, change the fields, done. A new page is made automatically.
const GAMES = [
  {
    slug: "example-game-one",
    title: "Example Game One",
    tagline: "A one-line hook for the game.",
    poster: "images/example-game-one.png",
    status: "Released",                    // Released / In development / Prototype
    genre: "3D Shooter",
    platforms: ["Windows", "Linux"],
    itch: "https://yourname.itch.io/example-game-one",
    description: "A longer description of the game. What is it, what do you do, what makes it different? Two or three short paragraphs work well.\n\nSecond paragraph goes here.",
    features: ["Feature one", "Feature two", "Feature three"],
    screenshots: []                        // e.g. ["images/g1-1.png", "images/g1-2.png"]
  },
  {
    slug: "example-game-two",
    title: "Example Game Two",
    tagline: "Another hook, another world.",
    poster: "images/example-game-two.png",
    status: "In development",
    genre: "Survival",
    platforms: ["Windows"],
    itch: "https://yourname.itch.io/example-game-two",
    description: "Describe your second game here.",
    features: ["Feature one", "Feature two"],
    screenshots: []
  }
];
