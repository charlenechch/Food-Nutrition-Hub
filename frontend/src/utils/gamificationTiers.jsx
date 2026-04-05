import React from 'react';

import woodUtensils from '../assets/badges/wood_utensils.png';
import silverUtensils from '../assets/badges/silver_utensils.png';
import woodCleaver from '../assets/badges/knife_copper.png';
import silverCleaver from '../assets/badges/knife_silver.png';
import goldCleaver from '../assets/badges/knife_gold.png';
import normalHat from '../assets/badges/chef_hat_normal.png';
import goldHat from '../assets/badges/chef_hat_gold.png';
import streakMaster from '../assets/badges/streak_master.png';
import foodEncyclopedia from '../assets/badges/food_encyclopedia.png';

const BadgeImg = ({ src, alt }) => (
  <img src={src} alt={alt} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
);

export const TIERS = [
  { 
    id: "novice", 
    minLevel: 1, 
    title: "Novice", 
    color: "#8D6E63", 
    icon: <BadgeImg src={woodUtensils} alt="Novice" />,
    desc: "The welcoming tier. Everyone starts here to learn the ropes." 
  },
  { 
    id: "foodie", 
    minLevel: 5, 
    title: "Foodie", 
    color: "#9CA3AF", 
    icon: <BadgeImg src={silverUtensils} alt="Foodie" />,
    desc: "You've earned 800 XP and know your way around the community!" 
  },
  { 
    id: "nutrition_enthusiast", 
    minLevel: 10, 
    title: "Nutrition Enthusiast", 
    color: "#D4A373", 
    icon: <BadgeImg src={woodCleaver} alt="Nutrition Enthusiast" />,
    desc: "The first major hurdle. Proves you didn't just make an account and leave." 
  },
  { 
    id: "nutrition_scholar", 
    minLevel: 20, 
    title: "Nutrition Scholar", 
    color: "#6B7280", 
    icon: <BadgeImg src={silverCleaver} alt="Nutrition Scholar" />,
    desc: "The core daily user. Reaching this requires consistent, genuine engagement." 
  },
  { 
    id: "nutrition_expert", 
    minLevel: 30, 
    title: "Nutrition Expert", 
    color: "#FBBF24", 
    icon: <BadgeImg src={goldCleaver} alt="Nutrition Expert" />,
    desc: "A highly respected community member. Your comments and recipes carry weight." 
  },
  { 
    id: "culinary_master", 
    minLevel: 40, 
    title: "Culinary Master", 
    color: "#1F2937",
    icon: <BadgeImg src={normalHat} alt="Culinary Master" />,
    desc: "The power users. You are likely driving a huge percentage of our content." 
  },
  { 
    id: "culinary_legend", 
    minLevel: 50, 
    title: "Culinary Legend", 
    color: "#F59E0B",
    icon: <BadgeImg src={goldHat} alt="Culinary Legend" />,
    desc: "The pinnacle of SarawakEats. An absolute legend." 
  },
  {
    id: "streak_master",
    minLevel: 999,
    title: "Streak Master",
    color: "#f97316",
    icon: <BadgeImg src={streakMaster} alt="Streak Master" />,
    desc: "Maintained a perfect daily quiz streak for 7 consecutive days."
  },
  {
    id: "food_encyclopedia",
    minLevel: 999, 
    title: "Food Encyclopedia",
    color: "#eab308",
    icon: <BadgeImg src={foodEncyclopedia} alt="Food Encyclopedia" />,
    desc: "Achieved a perfect 5/5 score on the daily quiz 10 times."
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