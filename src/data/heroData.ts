// src/data/heroData.ts
export const HERO_SUMMON_COST = 100;
export const HERO_SELL_RETURN_RATE = 0.5;

export interface HeroType {
    // placeholder for hero type enum or string union
}

export interface HeroData {
    id: number;
    name: string;
    imageKey: string;
    assetPath: string;
    fireEffect: string;
    fireSound: string;
    type: string; // using string for simplicity
    atkInterval: number;
    attackSpeed: number;
    range: number;
}

export const HEROES_DATA: HeroData[] = [
  { id: 0, name: 'Warrior', imageKey: 'Basic1', assetPath: 'assets/images/Basic1.png', fireEffect: 'assets/images/Basic_Effect.png', fireSound: 'assets/sounds/Basic_Sound.mp3', type: 'TypeA', atkInterval: 1.0, attackSpeed: 1.0, range: 200 },
  { id: 1, name: 'Knight', imageKey: 'Basic2', assetPath: 'assets/images/Basic2.png', fireEffect: 'assets/images/Basic_Effect.png', fireSound: 'assets/sounds/Basic_Sound.mp3', type: 'TypeA', atkInterval: 0.1, attackSpeed: 10.0, range: 190 },
  { id: 2, name: 'Paladin', imageKey: 'Basic3', assetPath: 'assets/images/Basic3.png', fireEffect: 'assets/images/Basic_Effect.png', fireSound: 'assets/sounds/Basic_Sound.mp3', type: 'TypeA', atkInterval: 3.0, attackSpeed: 0.33, range: 210 },
  { id: 3, name: 'Mage', imageKey: 'Rare1', assetPath: 'assets/images/Rare1.png', fireEffect: 'assets/images/Rare_Effect.png', fireSound: 'assets/sounds/Rare_Sound.mp3', type: 'TypeB', atkInterval: 1.0, attackSpeed: 1.0, range: 220 },
  { id: 4, name: 'Sorcerer', imageKey: 'Rare2', assetPath: 'assets/images/Rare2.png', fireEffect: 'assets/images/Rare_Effect.png', fireSound: 'assets/sounds/Rare_Sound.mp3', type: 'TypeB', atkInterval: 0.1, attackSpeed: 10.0, range: 230 },
  { id: 5, name: 'Warlock', imageKey: 'Rare3', assetPath: 'assets/images/Rare3.png', fireEffect: 'assets/images/Rare_Effect.png', fireSound: 'assets/sounds/Rare_Sound.mp3', type: 'TypeB', atkInterval: 3.0, attackSpeed: 0.33, range: 210 },
  { id: 6, name: 'Archer', imageKey: 'Epic1', assetPath: 'assets/images/Epic1.png', fireEffect: 'assets/images/Epic_Effect.png', fireSound: 'assets/sounds/Epic_Sound.mp3', type: 'TypeC', atkInterval: 1.0, attackSpeed: 1.0, range: 240 },
  { id: 7, name: 'Hunter', imageKey: 'Epic2', assetPath: 'assets/images/Epic2.png', fireEffect: 'assets/images/Epic_Effect.png', fireSound: 'assets/sounds/Epic_Sound.mp3', type: 'TypeC', atkInterval: 0.1, attackSpeed: 10.0, range: 230 },
  { id: 8, name: 'Ranger', imageKey: 'Epic3', assetPath: 'assets/images/Epic3.png', fireEffect: 'assets/images/Epic_Effect.png', fireSound: 'assets/sounds/Epic_Sound.mp3', type: 'TypeC', atkInterval: 3.0, attackSpeed: 0.33, range: 250 },
  { id: 9, name: 'Crusader', imageKey: 'Legendary1', assetPath: 'assets/images/Legendary1.png', fireEffect: 'assets/images/Legendary_Effect.png', fireSound: 'assets/sounds/Legendary_Sound.mp3', type: 'TypeD', atkInterval: 1.0, attackSpeed: 1.0, range: 260 },
  { id: 10, name: 'Guardian', imageKey: 'Legendary2', assetPath: 'assets/images/Legendary2.png', fireEffect: 'assets/images/Legendary_Effect.png', fireSound: 'assets/sounds/Legendary_Sound.mp3', type: 'TypeD', atkInterval: 0.1, attackSpeed: 10.0, range: 250 },
  { id: 11, name: 'Templar', imageKey: 'Legendary3', assetPath: 'assets/images/Legendary3.png', fireEffect: 'assets/images/Legendary_Effect.png', fireSound: 'assets/sounds/Legendary_Sound.mp3', type: 'TypeD', atkInterval: 3.0, attackSpeed: 0.33, range: 270 },
  { id: 12, name: 'Dragon', imageKey: 'Mythical1', assetPath: 'assets/images/Mythical1.png', fireEffect: 'assets/images/Mythical_Effect.png', fireSound: 'assets/sounds/Mythical_Sound.mp3', type: 'TypeE', atkInterval: 1.0, attackSpeed: 1.0, range: 280 },
  { id: 13, name: 'Phoenix', imageKey: 'Mythical2', assetPath: 'assets/images/Mythical2.png', fireEffect: 'assets/images/Mythical_Effect.png', fireSound: 'assets/sounds/Mythical_Sound.mp3', type: 'TypeE', atkInterval: 0.1, attackSpeed: 10.0, range: 300 },
  { id: 14, name: 'Titan', imageKey: 'Mythical3', assetPath: 'assets/images/Mythical3.png', fireEffect: 'assets/images/Mythical_Effect.png', fireSound: 'assets/sounds/Mythical_Sound.mp3', type: 'TypeE', atkInterval: 3.0, attackSpeed: 0.33, range: 260 }
];