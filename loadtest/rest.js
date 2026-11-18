// QMatch REST API 부하 테스트 (k6)
// 실행: k6 run loadtest/rest.js
// 대상 서버 바꾸기: k6 run -e BASE=http://localhost:8080 -e USER=user1 loadtest/rest.js
//
// 외부 게임 API(전적 조회)는 호출 제한이 있어서 일부러 넣지 않았습니다.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE || 'http://localhost:8080';
const USER = __ENV.USER || 'user1';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // 워밍업
    { duration: '1m', target: 50 },    // 보통 부하
    { duration: '1m', target: 100 },   // 높은 부하
    { duration: '30s', target: 200 },  // 스트레스 구간
    { duration: '30s', target: 0 },    // 정리
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],     // 실패율 1% 미만
    http_req_duration: ['p(95)<500'],   // 95%가 0.5초 이내
  },
};

export default function () {
  // 1) 채팅방 전체 목록 (검색 페이지 첫 화면)
  const rooms = http.get(`${BASE}/api/chat/rooms?gametag=ALL`, { tags: { name: 'GET 방 목록' } });
  check(rooms, { '방 목록 200': (r) => r.status === 200 });

  // 2) 게임 태그 목록
  const tags = http.get(`${BASE}/api/tags/lol`, { tags: { name: 'GET 게임 태그' } });
  check(tags, { '태그 200': (r) => r.status === 200 });

  // 3) 내가 참여한 방 목록
  const mine = http.get(`${BASE}/api/get/user/chatrooms?userId=${USER}`, { tags: { name: 'GET 내 방 목록' } });
  check(mine, { '내 방 목록 200': (r) => r.status === 200 });

  // 4) 친구 목록
  const friends = http.get(`${BASE}/api/friends/list?userId=${USER}`, { tags: { name: 'GET 친구 목록' } });
  check(friends, { '친구 목록 200': (r) => r.status === 200 });

  sleep(1); // 실제 사용자처럼 1초 쉬기
}
