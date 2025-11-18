# QMatch - 개발자 가이드

25년 Yuhan 졸업작품 프로젝트 (개발 브랜치)

이 문서는 QMatch 프로젝트의 개발 환경 설정 및 개발 가이드입니다.

---

## 📋 목차

- [개발 환경 설정](#개발-환경-설정)
- [프로젝트 구조](#프로젝트-구조)
- [로컬 개발 환경 실행](#로컬-개발-환경-실행)
- [빌드 및 배포](#빌드-및-배포)
- [개발 가이드](#개발-가이드)
- [API 문서](#api-문서)
- [테스트](#테스트)
- [기여 가이드](#기여-가이드)

---

## 개발 환경 설정

### 필수 요구사항

#### Backend
- **JDK 21** 이상
- **Gradle 8.x** 이상
- **MySQL 8.0** 이상
- **Spring Boot 3.4.5**

#### Frontend
- **Node.js 18.x** 이상
- **npm 9.x** 이상
- **Electron 35.1.4**

### 환경 변수 설정

#### Backend (`backend/src/main/resources/application.properties`)

```properties
# 데이터베이스 설정
spring.datasource.url=jdbc:mysql://localhost:3306/qmatch_db
spring.datasource.username=your_username
spring.datasource.password=your_password

# API 키 설정 (환경 변수 또는 .env 파일 사용)
dnf.api-key=${dnf_api}
riot.api-key=${riot_api}
lostark.api-key=${lostark_api}
maple.api.key=${maple_api}

# Agora 설정
agora.app-id=${agora_id}
agora.app-certificate=${agora_certificate}

# 파일 업로드 경로
upload.path=./uploads/profile

# 프론트엔드 URL
front_url=http://localhost:5173

# 메일 설정 (Gmail)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
spring.mail.from-name=QMatch
```

#### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8080
FRONT_DOMAIN=http://localhost:5173
```

### 데이터베이스 설정

1. MySQL 데이터베이스 생성:
```sql
CREATE DATABASE qmatch_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Spring Boot가 자동으로 테이블을 생성합니다 (`spring.jpa.hibernate.ddl-auto=update`)

---

## 프로젝트 구조

```
QMatch/
├── backend/                 # Spring Boot 백엔드
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/       # Java 소스 코드
│   │   │   └── resources/  # 설정 파일
│   │   └── test/           # 테스트 코드
│   ├── build.gradle        # Gradle 빌드 설정
│   └── uploads/            # 업로드된 파일
│
├── frontend/               # React + Electron 프론트엔드
│   ├── src/
│   │   ├── api/           # API 클라이언트
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── feature/       # 기능별 페이지
│   │   ├── hooks/         # Custom React Hooks
│   │   ├── modal/         # 모달 컴포넌트
│   │   ├── route/         # 라우트 페이지
│   │   └── utils/         # 유틸리티 함수
│   ├── main.js            # Electron 메인 프로세스
│   ├── package.json       # npm 의존성
│   └── vite.config.js     # Vite 설정
│
└── README.md              # 프로덕션 README
```

---

## 로컬 개발 환경 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd QMatch
```

### 2. Backend 실행

```bash
cd backend

# Gradle Wrapper를 사용하여 실행
./gradlew bootRun

# 또는 Windows의 경우
gradlew.bat bootRun
```

Backend는 `http://localhost:8080`에서 실행됩니다.

### 3. Frontend 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행 (React + Electron)
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행되며, Electron 앱이 자동으로 열립니다.

### 4. 개발 모드 특징

- **Hot Module Replacement (HMR)**: 코드 변경 시 자동 새로고침
- **개발자 도구**: Electron 창에서 DevTools 자동 열림
- **로그 파일**: Electron 로그는 `%APPDATA%/QMatch/electron-main.log`에 저장

---

## 빌드 및 배포

### Frontend 빌드

#### React 빌드만 수행
```bash
cd frontend
npm run build:react
```
빌드 결과는 `frontend/web-build/`에 생성됩니다.

#### Electron 앱 빌드 (Windows)
```bash
cd frontend
npm run dist
```
빌드 결과는 `frontend/dist/`에 생성됩니다.

### Backend 빌드

```bash
cd backend
./gradlew build
```
빌드 결과는 `backend/build/libs/`에 생성됩니다.

### 배포용 JAR 생성

```bash
cd backend
./gradlew bootJar
```

---

## 개발 가이드

### 코드 스타일

#### Java (Backend)
- Java 코딩 컨벤션 준수
- Lombok 사용 권장
- Spring Boot Best Practices 따르기

#### JavaScript/React (Frontend)
- ESLint 규칙 준수
- 함수형 컴포넌트 및 Hooks 사용
- 컴포넌트는 기능별로 분리

### 브랜치 전략

- **main**: 프로덕션 안정 버전
- **develop**: 개발 통합 브랜치
- **feature/**: 기능 개발 브랜치
- **hotfix/**: 긴급 수정 브랜치

### 커밋 메시지 규칙

```
[타입] 간단한 설명

상세 설명 (선택사항)

타입:
- feat: 새로운 기능
- fix: 버그 수정
- docs: 문서 수정
- style: 코드 포맷팅
- refactor: 코드 리팩토링
- test: 테스트 추가/수정
- chore: 빌드 설정 등
```

### 주요 개발 포인트

#### WebSocket 통신
- STOMP 프로토콜 사용
- `useGlobalStomp` Hook으로 전역 관리
- 실시간 채팅 및 알림에 활용

#### 게임 상태 감지
- Electron IPC를 통해 프로세스 목록 조회
- `ps-list` 패키지 사용
- 주기적으로 게임 실행 상태 확인

#### 음성 채팅
- Agora RTC SDK 사용
- `agora-rtc-sdk-ng` 패키지
- WebSocket으로 채널 정보 동기화

---

## API 문서

### 주요 엔드포인트

#### 인증
- `POST /api/loginProc` - 로그인
- `POST /api/signup` - 회원가입
- `POST /api/logout` - 로그아웃

#### 채팅
- `GET /api/chat/rooms` - 채팅방 목록
- `POST /api/chat/rooms` - 채팅방 생성
- `GET /api/chat/messages/{roomId}` - 메시지 조회

#### 친구
- `GET /api/friends` - 친구 목록
- `POST /api/friends/request` - 친구 요청
- `DELETE /api/friends/{friendId}` - 친구 삭제

자세한 API 문서는 Swagger UI를 통해 확인할 수 있습니다 (개발 중).

---

## 기여 가이드

1. **이슈 생성**: 버그 리포트나 기능 제안을 이슈로 등록
2. **브랜치 생성**: `feature/기능명` 형식으로 브랜치 생성
3. **개발 및 테스트**: 기능 개발 후 테스트 수행
4. **Pull Request**: develop 브랜치로 PR 생성
5. **코드 리뷰**: 팀원의 코드 리뷰 후 머지

### PR 체크리스트

- [ ] 코드가 정상적으로 작동하는가?
- [ ] 테스트를 통과하는가?
- [ ] ESLint/코드 스타일을 준수하는가?
- [ ] 문서를 업데이트했는가?
- [ ] 불필요한 주석이나 디버그 코드를 제거했는가?

---

## 문제 해결

### 일반적인 개발 이슈

**Q: Backend가 시작되지 않아요.**
- MySQL이 실행 중인지 확인
- `application.properties`의 데이터베이스 설정 확인
- 포트 8080이 사용 중인지 확인

**Q: Frontend에서 API 호출이 실패해요.**
- Backend가 실행 중인지 확인
- `.env` 파일의 `VITE_API_URL` 확인
- CORS 설정 확인

**Q: Electron에서 쿠키가 저장되지 않아요.**
- `main.js`의 쿠키 설정 확인
- 개발자 도구에서 Application > Cookies 확인
- 로그 파일 확인 (`%APPDATA%/QMatch/electron-main.log`)

**Q: 게임 상태 감지가 안 돼요.**
- `ps-list` 패키지가 정상 설치되었는지 확인
- 게임 실행 파일명이 정확한지 확인
- Electron IPC 통신 확인

---

## 추가 리소스

- [Spring Boot 공식 문서](https://spring.io/projects/spring-boot)
- [React 공식 문서](https://react.dev)
- [Electron 공식 문서](https://www.electronjs.org)
- [Vite 공식 문서](https://vitejs.dev)

---

## 개발 팀 연락처

개발 관련 문의사항은 GitHub Issues를 통해 등록해주세요.

---

**참고**: 이 문서는 develop 브랜치용 개발 가이드입니다. 프로덕션 사용자는 `README.md`를 참고하세요.

