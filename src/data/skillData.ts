// src/data/skillData.ts
import { Skill } from '../core/types';

export const SKILLS_DATA: Skill[] = [
    {
        id: 'berserk',
        name: 'Berserk',
        maxLevel: 5,
        levels: [
            {
                level: 1,
                description: '공격 시 10% 확률로 2초 동안 공격 속도 20% 증가',
                properties: {
                    activationChance: 0.1,
                    duration: 2,
                    damage: 0.2 // Using damage as a proxy for attack speed increase for now
                }
            },
            {
                level: 2,
                description: '공격 시 12% 확률로 2.5초 동안 공격 속도 25% 증가',
                properties: {
                    activationChance: 0.12,
                    duration: 2.5,
                    damage: 0.25
                }
            },
            {
                level: 3,
                description: '공격 시 14% 확률로 3초 동안 공격 속도 30% 증가',
                properties: {
                    activationChance: 0.14,
                    duration: 3,
                    damage: 0.3
                }
            },
            {
                level: 4,
                description: '공격 시 16% 확률로 3.5초 동안 공격 속도 35% 증가',
                properties: {
                    activationChance: 0.16,
                    duration: 3.5,
                    damage: 0.35
                }
            },
            {
                level: 5,
                description: '공격 시 20% 확률로 4초 동안 공격 속도 40% 증가',
                properties: {
                    activationChance: 0.2,
                    duration: 4,
                    damage: 0.4
                }
            }
        ]
    }
];
