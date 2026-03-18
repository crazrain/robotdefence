# 🤖 Robot Defence (Lucky Defense MVP)

Phaser 3와 TypeScript로 구현된 "운빨존많겜(Lucky Defense)" 스타일의 전략 디펜스 게임 MVP 프로젝트입니다.

## 🎮 게임 개요
플레이어는 무작위로 소환되는 영웅들을 전략적으로 배치하고, 동일한 영웅들을 조합하여 더 강력한 등급으로 진화시켜 밀려오는 적들로부터 기지를 방어해야 합니다.

## 🚀 주요 게임 메커니즘

### 1. 영웅 소환 (Gacha)
- 골드를 소모하여 무작위 등급(Basic ~ Mythical)의 영웅을 소환합니다.
- 소환 확률에 따라 다양한 타입의 영웅이 배치됩니다.

### 2. 조합 및 진화 (Merge System)
- **3-to-1 조합**: 동일한 종류와 등급의 영웅 3명이 한 그리드 셀에 모이면 상위 등급의 영웅 1명으로 자동 조합됩니다.
- **등급 체계**: Basic → Rare → Epic → Legendary → Mythical 순으로 강력해집니다.

### 3. 웨이브 시스템 (Wave System)
- 시간에 따라 적들이 순차적으로 스폰되며, 웨이브가 진행될수록 적의 체력과 속도가 증가합니다.
- 특정 웨이브마다 강력한 보스가 출현합니다.
- 화면 내 살아있는 적의 수가 일정 수(MAX_ALIVE)를 넘어가면 게임 오버됩니다.

### 4. 업그레이드 및 경제 (Economy)
- **골드(Gold)**: 적 처치 및 웨이브 클리어 보상으로 획득하며, 영웅 소환과 영구 업그레이드에 사용됩니다.
- **영구 업그레이드**: 등급별(Normal/Rare, Epic, Legendary/Mythical)로 공격력을 영구적으로 강화할 수 있습니다.

### 5. 편의 기능
- **배속 조절**: 게임 속도를 1x, 2x, 3x, 4x로 조절할 수 있습니다.
- **영웅 판매**: 불필요한 영웅을 판매하여 골드의 일부를 돌려받을 수 있습니다.

## 🌐 라이브 데모
이 게임은 아래 URL에서 직접 플레이해 보실 수 있습니다:
👉 [https://crazrain.github.io/robotdefence/](https://crazrain.github.io/robotdefence/)

## 🛠 기술 스택
- **Engine**: [Phaser 3](https://phaser.io/)
- **Language**: TypeScript
- **Bundler**: Vite
- **Package Manager**: Yarn (Berry/PnP)
- **Deployment**: GitHub Pages (via GitHub Actions)

## 📂 프로젝트 구조
```text
src/
├── core/         # 게임 엔진 설정, 상수, 전역 타입 정의
├── data/         # 영웅 데이터, 스킬 데이터, 웨이브 설정
├── objects/      # Hero, Enemy, Projectile 등 게임 객체 클래스
├── scenes/       # GameScene(메인 루프), EndScene(결과 화면)
├── systems/      # 매니저 클래스 (Economy, Grid, UI, Upgrade 등)
└── ui/           # HUD, 버튼, 패널 등 UI 컴포넌트
```

## 🏃 실행 및 배포 방법

### 개발 모드 실행
```bash
yarn dev
```

### 프로젝트 빌드
```bash
yarn build
```

### 배포 (GitHub Actions)
이 프로젝트는 GitHub Actions를 통해 자동 배포되도록 설정되어 있습니다. `main` 브랜치에 코드가 푸시되면 자동으로 빌드되어 GitHub Pages에 업데이트됩니다.

수동 배포가 필요한 경우 아래 명령어를 사용할 수 있습니다:
```bash
yarn deploy
```

## 🎨 에셋 출처
- 이미지: `public/assets/images/` 내 커스텀 에셋
- 사운드: `public/assets/sounds/` 내 효과음 및 배경음

---
이 프로젝트는 바이브코딩(Vibe Coding)을 통해 개발되었습니다.
