export const TIERS = [
  { 
    id: "novice", 
    minLevel: 1, 
    title: "Novice", 
    color: "#9CA3AF",
    icon: "🌱", 
    desc: "The welcoming tier. Everyone starts here to learn the ropes." 
  },
  { 
    id: "foodie", 
    minLevel: 5, 
    title: "Foodie", 
    color: "#F6AD55",
    icon: "🍔", 
    desc: "You've earned 800 XP and know your way around the community!" 
  },
  { 
    id: "nutrition_enthusiast", 
    minLevel: 10, 
    title: "Nutrition Enthusiast", 
    color: "#68D391",
    icon: "🥗", 
    desc: "The first major hurdle. Proves you didn't just make an account and leave." 
  },
  { 
    id: "nutrition_pro", 
    minLevel: 20, 
    title: "Nutrition Pro", 
    color: "#4299E1",
    icon: "🔬", 
    desc: "The core daily user. Reaching this requires consistent, genuine engagement." 
  },
  { 
    id: "nutrition_expert", 
    minLevel: 30, 
    title: "Nutrition Expert", 
    color: "#805AD5",
    icon: "🧠", 
    desc: "A highly respected community member. Your comments and recipes carry weight." 
  },
  { 
    id: "culinary_master", 
    minLevel: 40, 
    title: "Culinary Master", 
    color: "#F687B3",
    icon: "👨‍🍳", 
    desc: "The power users. You are likely driving a huge percentage of our content." 
  },
  { 
    id: "culinary_legend", 
    minLevel: 50, 
    title: "Culinary Legend", 
    color: "#D69E2E",
    icon: "👑", 
    desc: "The pinnacle of SarawakEats. An absolute legend." 
  }
];


export const getTierById = (id) => {
  return TIERS.find(t => t.id === id) || TIERS[0];
};

export const getTierByLevel = (level) => {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (level >= TIERS[i].minLevel) {
      return TIERS[i];
    }
  }
  return TIERS[0];
};