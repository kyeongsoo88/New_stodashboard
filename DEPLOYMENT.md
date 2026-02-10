# 배포 가이드 (Deployment Guide)

## 1. GitHub 저장소 생성 및 연결

### GitHub에서 저장소 생성
1. GitHub에서 "Create a new repository" 클릭
2. Repository name 입력 (예: `sto-dashboard`)
3. Public 또는 Private 선택
4. **중요**: README, .gitignore, license는 추가하지 않기 (이미 로컬에 있음)
5. "Create repository" 클릭

### 로컬 저장소와 GitHub 연결

GitHub 저장소를 생성한 후, 제공되는 명령어를 실행하거나 아래 명령어를 사용하세요:

```bash
# GitHub 저장소 URL을 YOUR_USERNAME과 YOUR_REPO_NAME으로 변경하세요
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**예시:**
```bash
git remote add origin https://github.com/username/sto-dashboard.git
git branch -M main
git push -u origin main
```

## 2. Vercel 배포

### Vercel 웹사이트에서 배포
1. https://vercel.com 접속
2. "Add New Project" 클릭
3. GitHub 저장소 선택 또는 Import
4. 프로젝트 설정:
   - **Root Directory**: `frontend` 선택
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm install` (기본값)
5. "Deploy" 클릭

### Vercel CLI로 배포 (선택사항)

```bash
# Vercel CLI 설치
npm i -g vercel

# frontend 폴더로 이동
cd frontend

# 배포
vercel
```

## 3. 환경 변수 설정 (필요한 경우)

Vercel 대시보드에서:
1. 프로젝트 설정 → Environment Variables
2. 필요한 환경 변수 추가

## 4. 자동 배포 설정

- GitHub 저장소에 코드를 푸시하면 자동으로 Vercel에서 재배포됩니다
- Pull Request 생성 시 Preview 배포도 자동 생성됩니다

## 5. 커스텀 도메인 설정 (선택사항)

Vercel 대시보드에서:
1. Settings → Domains
2. 원하는 도메인 추가






















