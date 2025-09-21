import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname 대신 import.meta.url을 사용하여 현재 파일의 디렉토리 경로를 얻음
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // Git 마지막 커밋 날짜 가져오기 (YYYYMMDDHHmmss 형식)
  const gitDate = execSync('git log -1 --format=%cd --date=format:%Y%m%d%H%M%S').toString().trim();
  const versionContent = `export const GAME_VERSION = '${gitDate}';
`;

  const versionFilePath = path.resolve(__dirname, '../src/core/version.ts');
  fs.writeFileSync(versionFilePath, versionContent, 'utf8');

  console.log(`Generated ${versionFilePath} with version: ${gitDate}`);
} catch (error) {
  console.error('Failed to generate version.ts:', error.message);
  // Git이 설치되어 있지 않거나, Git 레포지토리가 아닌 경우를 대비하여 기본 버전 생성
  const defaultVersionContent = `export const GAME_VERSION = '00000000000000_nogit';
`;
  const versionFilePath = path.resolve(__dirname, '../src/core/version.ts');
  fs.writeFileSync(versionFilePath, defaultVersionContent, 'utf8');
  console.log(`Generated ${versionFilePath} with default version: 00000000000000_nogit`);
}
