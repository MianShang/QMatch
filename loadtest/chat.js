// QMatch 실시간 채팅(STOMP over WebSocket) 부하 테스트 (k6)
// 실행: k6 run -e ROOM=<테스트용 방 ID> loadtest/chat.js
//
// 동시 접속자 N명이 같은 방을 구독하고 2초마다 메시지를 보냅니다.
// 메시지 안에 보낸 시각을 넣어서, 다른 사람이 받기까지 걸린 시간(전달 지연)을 잽니다.
// STOMP로 보내는 메시지는 DB에 저장되지 않아서 채팅 기록이 쌓이지 않습니다.
//
// SAVE=1 을 주면 실제 앱처럼 메시지마다 DB 저장 API 2개도 같이 호출합니다.
//   POST /api/user/add/userchatlist  (채팅 내역 저장)
//   POST /api/chat/isread            (안 읽은 메시지 저장)
//   예) k6 run -e ROOM=<방 ID> -e SAVE=1 loadtest/chat.js
//   끝나고 정리 SQL은 loadtest/README.md 참고
import ws from 'k6/ws';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

const BASE_WS = __ENV.BASE_WS || 'ws://localhost:8080';
const BASE_HTTP = __ENV.BASE || 'http://localhost:8080';
const ROOM = __ENV.ROOM;
const SENDER = __ENV.USER || 'user1';
const SESSION_SECONDS = Number(__ENV.SESSION || 60);
const SAVE = __ENV.SAVE === '1';

const saveDuration = new Trend('chat_save_ms', true);
const saveFailed = new Rate('chat_save_failed');

const latency = new Trend('chat_delivery_ms', true);
const received = new Counter('chat_messages_received');
const sent = new Counter('chat_messages_sent');

export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    chat_delivery_ms: ['p(95)<1000'],   // 95%가 1초 안에 전달 (KPI: 메시지 전달 지연 1초 이내)
    ws_connecting: ['p(95)<1000'],
    ...(SAVE ? { chat_save_ms: ['p(95)<500'], chat_save_failed: ['rate<0.01'] } : {}),
  },
};

const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } };
function saveToDb(content) {
  const body = JSON.stringify({ chatRoom: ROOM, chatContent: content, userId: SENDER, isPinned: false });
  const r1 = http.post(`${BASE_HTTP}/api/user/add/userchatlist`, body, { ...JSON_HEADERS, tags: { name: 'POST 채팅 저장' } });
  const r2 = http.post(`${BASE_HTTP}/api/chat/isread`, body, { ...JSON_HEADERS, tags: { name: 'POST 안읽음 저장' } });
  saveDuration.add(r1.timings.duration + r2.timings.duration);
  saveFailed.add(r1.status >= 400 || r2.status >= 400 || r1.status === 0 || r2.status === 0);
}

const NUL = '\u0000';
function frame(command, headers, body = '') {
  const h = Object.entries(headers).map(([k, v]) => `${k}:${v}`).join('\n');
  return `${command}\n${h}\n\n${body}${NUL}`;
}

export function setup() {
  if (!ROOM) {
    throw new Error('ROOM 환경변수가 필요합니다. 예) k6 run -e ROOM=b29700e5-... loadtest/chat.js');
  }
}

export default function () {
  // Spring SockJS 엔드포인트는 /websocket 경로로 순수 WebSocket 연결을 받습니다.
  const url = `${BASE_WS}/gs-guide-websocket/websocket`;

  const res = ws.connect(url, {}, (socket) => {
    socket.on('open', () => {
      socket.send(frame('CONNECT', { 'accept-version': '1.2', host: 'localhost', 'heart-beat': '0,0' }));
    });

    socket.on('message', (data) => {
      // 한 번에 여러 프레임이 올 수 있음
      for (const raw of String(data).split(NUL)) {
        const msg = raw.replace(/^\n+/, '');
        if (msg.startsWith('CONNECTED')) {
          socket.send(frame('SUBSCRIBE', { id: `sub-${__VU}`, destination: `/topic/chat/${ROOM}` }));
          // 2초마다 메시지 전송
          socket.setInterval(() => {
            const text = `loadtest vu=${__VU} sentAt=${Date.now()}`;
            const body = JSON.stringify({ name: SENDER, message: text, isPinned: false });
            socket.send(frame('SEND', { destination: `/app/chat/${ROOM}`, 'content-type': 'application/json' }, body));
            sent.add(1);
            if (SAVE) saveToDb(text);
          }, 2000);
        } else if (msg.startsWith('MESSAGE')) {
          received.add(1);
          const m = msg.match(/sentAt=(\d+)/);
          if (m) latency.add(Date.now() - Number(m[1]));
        } else if (msg.startsWith('ERROR')) {
          console.error(`STOMP ERROR: ${msg.slice(0, 200)}`);
        }
      }
    });

    // 한 사용자 세션 길이
    socket.setTimeout(() => socket.close(), SESSION_SECONDS * 1000);
  });

  check(res, { 'WebSocket 연결 101': (r) => r && r.status === 101 });
}
