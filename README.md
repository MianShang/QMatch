# QMatch
25년 Yuhan 졸업작품 프로젝트 
게임 매칭 및 실시간 채팅 플랫폼

## 📋 프로젝트 소개

QMatch는 게이머들을 위한 실시간 채팅 및 매칭 플랫폼입니다. 다양한 게임을 플레이하는 유저들이 게임별 채팅방에서 소통하고, 친구를 추가하며, 음성 채팅을 통해 함께 게임을 즐길 수 있습니다.

## ✨ 주요 기능

### 🔐 인증 및 사용자 관리
- 회원가입 및 로그인
- 프로필 관리
- 게임 계정 연동 (게임 코드 등록)
- 대표 계정 설정

### 💬 실시간 채팅
- 게임별 채팅방 생성 및 참여
- STOMP WebSocket 기반 실시간 메시징
- 채팅방 태그 시스템 (게임 모드, 티어, 라인 등)
- 읽음/안읽음 상태 표시
- 채팅방 검색

### 🎮 게임 지원
- **리그 오브 레전드 (LoL)**: 전적 조회, 티어 표시, 라인별 매칭
- **메이플스토리**: 보스 레이드 매칭
- **로스트아크**: 캐릭터 정보 연동
- **던전앤파이터 (DNF)**: 캐릭터 스펙 조회

### 🎤 음성 채팅
- Agora RTC 기반 음성 채팅
- 채팅방별 음성 채널
- 마이크 음소거 기능
- 실시간 참여자 표시

### 👥 친구 시스템
- 친구 추가 및 요청 관리
- 친구 간 1:1 채팅
- 친구 상태 확인 (온라인/오프라인/게임 중)
- 친구 초대 알림

### 🎯 게임 상태 추적
- 실행 중인 게임 프로세스 자동 감지
- 게임 플레이 중 상태 표시
- 실시간 게임 상태 업데이트

### 🛡️ 관리 기능
- 사용자 신고 시스템
- 관리자 페이지
- 채팅방 관리

## 🛠️ 기술 스택

### Backend
- **Java 21**
- **Spring Boot 3.4.5**
- **Spring Security** - 인증 및 권한 관리
- **Spring Data JPA** - 데이터베이스 ORM
- **Spring WebSocket** - 실시간 통신
- **MySQL** - 데이터베이스
- **Caffeine Cache** - 캐싱
- **Spring Mail** - 이메일 발송

### Frontend
- **React 19** - UI 라이브러리
- **Vite 6.2.0** - 빌드 도구
- **Electron 35.1.4** - 데스크톱 애플리케이션
- **React Router DOM 7.5.3** - 라우팅
- **STOMP.js** - WebSocket 클라이언트
- **Agora RTC SDK** - 음성 채팅
- **Axios** - HTTP 클라이언트
- **React Toastify** - 알림

### 외부 API
- Riot Games API (리그 오브 레전드)
- Lost Ark API
- MapleStory API
- DNF API

## 📁 프로젝트 구조

```
QMatch/
├── backend/              # Spring Boot 백엔드
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/example/backend/
│   │   │   │       ├── Controller/     # REST API 컨트롤러
│   │   │   │       ├── Service/        # 비즈니스 로직
│   │   │   │       ├── Repository/     # 데이터 접근 계층
│   │   │   │       ├── Entity/         # JPA 엔티티
│   │   │   │       ├── Dto/            # 데이터 전송 객체
│   │   │   │       ├── Security/       # 보안 설정
│   │   │   │       └── Websocket/      # WebSocket 설정
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── build.gradle
│
└── frontend/            # React + Electron 프론트엔드
    ├── src/
    │   ├── components/  # 재사용 가능한 컴포넌트
    │   ├── route/       # 페이지 컴포넌트
    │   ├── modal/       # 모달 컴포넌트
    │   ├── hooks/       # 커스텀 훅
    │   ├── feature/     # 기능별 모듈
    │   ├── lib/         # 유틸리티 및 API
    │   └── utils/       # 헬퍼 함수
    ├── electron/        # Electron 메인 프로세스
    ├── public/          # 정적 파일
    └── package.json
```

