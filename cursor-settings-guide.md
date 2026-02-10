# Cursor IDE 설정 확인 가이드

## 1. 설정 열기 방법

### 방법 A: 단축키
- **Windows/Linux**: `Ctrl + ,`
- **Mac**: `Cmd + ,`

### 방법 B: 메뉴
- **Windows/Linux**: `File > Preferences > Settings`
- **Mac**: `Cursor > Settings`

### 방법 C: JSON 직접 편집
- `Ctrl/Cmd + Shift + P` → `Preferences: Open User Settings (JSON)` 입력

---

## 2. 확인할 설정 키워드

설정 검색창에서 다음 키워드들을 검색해보세요:

### 브라우저 관련
- `browser`
- `preview`
- `devtools`
- `inspector`

### 요소 선택 관련
- `element selector`
- `element picker`
- `select element`
- `multi select`
- `multi-cursor`

### AI Agent 관련
- `agent`
- `ai browser`
- `ai tools`
- `composer`
- `chat`

---

## 3. 확인할 수 있는 설정 항목들

### VS Code 기반 설정 (Cursor는 VS Code 기반)
```json
{
  // 다중 커서 관련
  "editor.multiCursorModifier": "ctrlCmd",
  "editor.suggestSelection": "first",
  
  // 브라우저/프리뷰 관련
  "workbench.editor.enablePreview": true,
  "workbench.editor.enablePreviewFromQuickOpen": true,
  
  // AI 관련 (Cursor 전용)
  "cursor.ai.browser.enabled": true,
  "cursor.ai.elementSelector.multiSelect": true,
  "cursor.composer.enabled": true
}
```

---

## 4. Cursor 특정 설정 위치

Cursor IDE는 VS Code 기반이지만 자체 설정이 있을 수 있습니다:

### Windows
```
%APPDATA%\Cursor\User\settings.json
또는
C:\Users\YourName\AppData\Roaming\Cursor\User\settings.json
```

### Mac
```
~/Library/Application Support/Cursor/User/settings.json
```

### Linux
```
~/.config/Cursor/User/settings.json
```

---

## 5. 확인할 사항

1. **"Select Element" 기능이 어떻게 동작하는지**
   - 단일 선택만 되는지
   - 다중 선택이 가능한지

2. **"New Agent 창"으로 전환되는 이유**
   - 설정에서 "Auto switch to agent on element select" 같은 옵션이 있는지
   - Composer/AI 관련 설정 확인

3. **최근 업데이트 내용**
   - `Help > About`에서 버전 확인
   - Cursor 공식 문서나 릴리스 노트 확인

---

## 6. 대안 방법

설정에서 해결이 안 되면:

1. **Cursor Discord 커뮤니티**에 질문
   - 다른 사용자들도 같은 문제가 있는지 확인

2. **Cursor GitHub Issues**에 리포트
   - Bug 리포트 작성

3. **Cursor 지원팀**에 문의
   - 공식 웹사이트의 지원 채널 활용

---

## 7. 임시 해결책

설정이 변경 불가능하다면:
- 외부 브라우저(Chrome, Edge)에서 개발 서버 열기
- 개발자 도구(`F12`)에서 요소 선택
- 선택한 요소를 복사해서 Cursor 채팅에 붙여넣기













