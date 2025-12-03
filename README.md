# QMatch

25년 유한대 졸업작품 프로젝트

게임 플레이어를 위한 실시간 매칭 및 커뮤니케이션 플랫폼

---

## 📋 목차

- [소개](#소개)
- [주요 기능](#주요-기능)
- [설치 및 실행](#설치-및-실행)
- [실행 화면](#실행-화면)
- [기술 스택](#기술-스택)
- [라이선스](#라이선스)
- 

---

## 소개

QMatch는 게임 플레이어들이 쉽게 팀원을 찾고, 실시간으로 소통할 수 있는 데스크톱 애플리케이션입니다. 다양한 게임 카테고리별로 채팅방을 생성하고, 음성 채팅을 통해 더욱 원활한 소통을 지원합니다.

---

## 주요 기능

### 🔐 인증 및 사용자 관리
- 로그인 및 회원가입
- 프로필 관리
- 친구 시스템 (친구 추가, 삭제, 초대)

### 💬 실시간 채팅
- 게임 카테고리별 채팅방 생성 및 관리
- 실시간 메시지 전송 및 수신
- 이미지 메시지 지원
- 링크 미리보기
- 이모지 지원

### 🎤 음성 채팅
- 실시간 음성 통화
- 음성 채널 생성 및 관리
- 마이크 음소거 기능

### 🎮 게임 연동
- 게임 실행 상태 자동 감지
- 지원 게임:
  - 리그 오브 레전드 (LoL)
  - 메이플스토리
  - 로스트아크
  - 던전앤파이터

### 🔍 검색 및 매칭
- 사용자 검색
- 게임별 매칭 서비스

### 👥 관리자 기능
- 관리자 페이지
- 사용자 관리 및 신고 처리

---

## 설치 및 실행

### Windows 설치

1. **최신 릴리스 다운로드**
   - GitHub Releases에서 `QMatch Setup X.X.X.exe` 파일을 다운로드합니다.

2. **설치 실행**
   - 다운로드한 설치 파일을 실행합니다.
   - 설치 마법사의 안내에 따라 설치를 진행합니다.
   - 설치 경로를 선택할 수 있습니다.

3. **애플리케이션 실행**
   - 설치 완료 후 바탕화면의 QMatch 아이콘을 클릭하여 실행합니다.
   - 또는 시작 메뉴에서 QMatch를 검색하여 실행합니다.

### 첫 실행 시

1. 회원가입 또는 로그인을 진행합니다.
2. 프로필을 설정합니다.
3. 관심 있는 게임 카테고리 채팅방에 참여합니다.

---

## 실행 화면

### 로비 페이지
<img width="2080" height="1390" alt="로비 페이지" src="https://github.com/user-attachments/assets/71beb27c-8035-492b-a069-da82b4185c24" />

### 프로필
<img width="2080" height="1390" alt="프로필" src="https://github.com/user-attachments/assets/2c24dea9-774b-45c9-8f42-4380dab874dc" />

### 서치 페이지
<img width="2080" height="1390" alt="서치 페이지" src="https://github.com/user-attachments/assets/18fa3870-c4c4-4141-b7f5-3ebc03793365" />

### 방 입장
<img width="2080" height="1390" alt="방 입장" src="https://github.com/user-attachments/assets/3e121a48-7b5e-4083-9310-8ced1d1a9f80" />

### 음성 채팅
<img width="2080" height="1390" alt="음성 채팅" src="https://github.com/user-attachments/assets/7400c7ce-552d-4a42-bf88-e280f44b2a93" />
<img width="2080" height="1390" alt="음성 설정" src="https://github.com/user-attachments/assets/872fe7bc-e1d9-4436-b215-aad5340acf82" />

### 관리자 페이지
<img width="2078" height="1390" alt="관리자 페이지" src="https://github.com/user-attachments/assets/d18435e2-38ed-4d0a-b1d6-e9c94c811a27" />

---

## 기술 스택

### Backend
- **Java 21**
- **Spring Boot 3.4.5**
- **Spring Security** - 인증 및 보안
- **Spring WebSocket** - 실시간 통신
- **Spring Data JPA** - 데이터베이스 연동
- **MySQL** - 데이터베이스
- **Agora SDK** - 음성 채팅

### Frontend
- <span style="margin-right: 1rem">
        <img src="https://img.shields.io/badge/react-blue?style=for-the-badge&logo=react&logoColor=darkblue">
    </span> - UI 프레임워크
- <span style="margin-right: 1rem">
        <img src="https://img.shields.io/badge/vite-white?style=for-the-badge&logo=vite&logoColor=yellow">
    </span> - 빌드 도구
- <span style="margin-right: 1rem">
        <img src="https://img.shields.io/badge/electron-dark?style=for-the-badge&logo=electron&logoColor=">
    </span> - 데스크톱 애플리케이션
- <span style="margin-right: 1rem">
        <img src="https://img.shields.io/badge/stomp-blue?style=for-the-badge&logo=stomp&logoColor=">
    </span> - WebSocket 클라이언트
- <img src="https://img.shields.io/badge/react-router-blue?style=for-the-badge&logo=react&logoColor=darkblue" /> - 라우팅

### 외부 API
- Riot Games API
- 던전앤파이터 API
- 로스트아크 API
- 메이플스토리 API

---

## 버전 정보

- **현재 버전**: 0.0.7
- **최종 업데이트**: 2025년

---

## 문제 해결

### 일반적인 문제

**Q: 로그인이 되지 않아요.**
- 인터넷 연결을 확인해주세요.
- 서버가 정상적으로 작동 중인지 확인해주세요.

**Q: 음성 채팅이 작동하지 않아요.**
- 마이크 권한이 허용되어 있는지 확인해주세요.
- 방화벽 설정을 확인해주세요.

**Q: 게임 상태가 감지되지 않아요.**
- 게임이 실행 중인지 확인해주세요.
- 지원되는 게임인지 확인해주세요.

---

## 지원

문제가 발생하거나 문의사항이 있으시면:
- GitHub Issues에 문제를 등록해주세요.
- 이메일로 문의해주세요.

---

## 라이선스

이 프로젝트는 졸업작품 프로젝트입니다.

---

## 제작자

25년 QMatch 졸업작품 팀
