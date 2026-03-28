import React from 'react';
import { UtensilsIcon, ChefKnifeIcon } from '../components/BadgeAssets';

export const TIERS = [
  { 
    id: "novice", 
    minLevel: 1, 
    title: "Novice", 
    color: "#8D6E63", 
    icon: <UtensilsIcon materialId="mat-wood" size={28} />,
    desc: "The welcoming tier. Everyone starts here to learn the ropes." 
  },
  { 
    id: "foodie", 
    minLevel: 5, 
    title: "Foodie", 
    color: "#DD6B20",
    icon: <UtensilsIcon materialId="mat-bronze" size={28} glow={true} />,
    desc: "You've earned 800 XP and know your way around the community!" 
  },
  { 
    id: "nutrition_enthusiast", 
    minLevel: 10, 
    title: "Nutrition Enthusiast", 
    color: "#38A169",
    icon: <ChefKnifeIcon materialId="mat-emerald" size={30} glow={true} />,
    desc: "The first major hurdle. Proves you didn't just make an account and leave." 
  },
  { 
    id: "nutrition_pro", 
    minLevel: 20, 
    title: "Nutrition Pro", 
    color: "#3182CE",
    icon: <ChefKnifeIcon materialId="mat-sapphire" size={30} glow={true} />,
    desc: "The core daily user. Reaching this requires consistent, genuine engagement." 
  },
  { 
    id: "nutrition_expert", 
    minLevel: 30, 
    title: "Nutrition Expert", 
    color: "#805AD5",
    icon: <ChefKnifeIcon materialId="mat-amethyst" size={30} glow={true} />,
    desc: "A highly respected community member. Your comments and recipes carry weight." 
  },
  { 
    id: "culinary_master", 
    minLevel: 40, 
    title: "Culinary Master", 
    color: "#D53F8C",
    icon: <ChefKnifeIcon materialId="mat-ruby" size={32} glow={true} />,
    desc: "The power users. You are likely driving a huge percentage of our content." 
  },
  { 
    id: "culinary_legend", 
    minLevel: 50, 
    title: "Culinary Legend", 
    color: "#D69E2E",
    icon: <ChefKnifeIcon materialId="mat-gold" size={36} glow={true} extraSparkle={true} />,
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