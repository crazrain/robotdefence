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
                description: '공격 시 20% 확률로 2초 동안 공격 속도 20% 증가',
                properties: {
                    activationChance: 0.05,
                    duration: 2,
                    damage: 0.2 // Using damage as a proxy for attack speed increase for now
                }
            },
            {
                level: 2,
                description: '공격 시 20% 확률로 2.5초 동안 공격 속도 25% 증가',
                properties: {
                    activationChance: 0.2,
                    duration: 2.5,
                    damage: 0.25
                }
            },
            {
                level: 3,
                description: '공격 시 20% 확률로 3초 동안 공격 속도 30% 증가',
                properties: {
                    activationChance: 0.2,
                    duration: 3,
                    damage: 0.3
                }
            },
            {
                level: 4,
                description: '공격 시 20% 확률로 3.5초 동안 공격 속도 35% 증가',
                properties: {
                    activationChance: 0.2,
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
    },
    {
        id: 'scorchedEarth',
        name: 'Scorched Earth',
        maxLevel: 5,
        levels: [
            {
                level: 1,
                description: '피격 지점에 3초 동안 초당 5의 피해를 주는 불타는 지역을 생성합니다. (범위: 50)',
                properties: {
                    duration: 3,
                    damage: 5,
                    radius: 50,
                    tickInterval: 1000
                }
            },
            {
                level: 2,
                description: '피격 지점에 3.5초 동안 초당 10의 피해를 주는 불타는 지역을 생성합니다. (범위: 55)',
                properties: {
                    duration: 3.5,
                    damage: 10,
                    radius: 55,
                    tickInterval: 1000
                }
            },
            {
                level: 3,
                description: '피격 지점에 4초 동안 초당 15의 피해를 주는 불타는 지역을 생성합니다. (범위: 60)',
                properties: {
                    duration: 4,
                    damage: 15,
                    radius: 60,
                    tickInterval: 1000
                }
            },
            {
                level: 4,
                description: '피격 지점에 4.5초 동안 초당 20의 피해를 주는 불타는 지역을 생성합니다. (범위: 65)',
                properties: {
                    duration: 4.5,
                    damage: 20,
                    radius: 65,
                    tickInterval: 1000
                }
            },
            {
                level: 5,
                description: '피격 지점에 5초 동안 초당 25의 피해를 주는 불타는 지역을 생성합니다. (범위: 70)',
                properties: {
                    duration: 5,
                    damage: 25,
                    radius: 70,
                    tickInterval: 1000
                }
            }
        ]
    }
];
