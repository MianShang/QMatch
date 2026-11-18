# QMatch 부하(스트레스) 테스트

[k6](https://k6.io)로 서버에 가짜 사용자를 수십~수백 명 붙여서 버티는지 확인합니다.

## 준비

1. k6 설치 (서버를 돌리는 노트북에서)
   ```powershell
   winget install k6 --source winget
   ```
   설치 후 PowerShell 창을 새로 열어 `k6 version`이 나오면 됩니다.
2. 백엔드를 켜 둡니다.
3. **채팅 테스트용 방을 따로 하나 만듭니다.** 테스트 중 그 방에 메시지가 초당 수십 개씩 쏟아지므로, 다른 사람이 쓰는 방은 쓰지 마세요.

> 테스트는 반드시 서버 노트북에서 `localhost`로 돌립니다. Cloudflare 터널 주소로 돌리면 터널 속도를 재게 되고, 무료 터널 이용 약관에도 어긋날 수 있습니다.

## 1. REST API 부하 테스트

방 목록·태그·내 방 목록·친구 목록 조회를 동시 사용자 20 → 50 → 100 → 200명으로 늘려 가며 보냅니다(약 3분 30초).

```powershell
cd C:\Users\choige\Desktop\QMatch\QMatch
k6 run -e USER=user1 loadtest/rest.js
```

## 2. 실시간 채팅 부하 테스트

동시 접속자 20 → 50 → 100명이 테스트용 방을 구독하고 2초마다 메시지를 보냅니다(약 2분 40초). 메시지는 DB에 저장되지 않습니다.

방 ID는 DBeaver에서 `SELECT id, name FROM chat_room;`으로 확인합니다.

```powershell
k6 run -e ROOM=<테스트용 방 ID> loadtest/chat.js
```

## 결과 보는 법

| 항목 | 뜻 | 기준 |
|---|---|---|
| `http_req_duration` p(95) | 요청 95%가 이 시간 안에 응답 | 500ms 이하 |
| `http_req_failed` | 실패한 요청 비율 | 1% 미만 |
| `chat_delivery_ms` p(95) | 메시지가 다른 사용자에게 도착하기까지 걸린 시간 | 1000ms 이하 |
| `ws_connecting` p(95) | WebSocket 연결에 걸린 시간 | 1000ms 이하 |
| `vus_max` | 최대 동시 사용자 수 | |

기준을 넘으면 결과 맨 아래에 ✗ 표시가 뜹니다. 어느 단계(동시 사용자 몇 명)부터 느려지는지 보면 서버 한계를 알 수 있습니다.
