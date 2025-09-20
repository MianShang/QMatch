// hooks/useChatSubscriber.js
import { useEffect } from 'react';

/**
 * 채팅방을 구독하고, 실시간 메시지를 수신하는 커스텀 훅
 *
 * @param {Object} selectedRoom   - 현재 선택된 채팅방 객체
 * @param {State} setMessages  - 메시지 상태를 설정하는 State
 * @param {Function} setClient    - STOMP 클라이언트 인스턴스를 설정하는 함수
 * @param {string} userData       - 현재 접속한 유저의 데이터 이 함수에선 아이디(userId)를 요구한다.
 * @param {Object} globalStomp   - 전역 STOMP 클라이언트 인스턴스
 */
export function useChatSubscriber(selectedRoom, setMessages, setClient, userData, globalStomp) {
  useEffect(() => {
    if (!selectedRoom || !globalStomp) return;

    const subscriptionId = `chat-messages-${selectedRoom.id}`;
    
    // 채팅 메시지 구독
    globalStomp.subscribe(
      `/topic/chat/${selectedRoom.id}`,
      (msg) => {
        try {
          // Message State Set
          setMessages(prev => [...prev, JSON.parse(msg.body)]);
        } catch (error) {
          console.error('채팅 메시지 처리 오류:', error);
        }
      },
      { id: subscriptionId }
    );

    // 클라이언트 인스턴스 설정 (기존 코드와의 호환성을 위해)
    setClient(globalStomp.getClient());

    // 퇴장 시 서버에 알림 전송 (현재 이부분 때문에 input 입력시 백엔드 로고 무한증식 버그가 있음)
    // 방나가기 로직이 ChatList페이지에 따로 있음으로 임시 삭제 추후 채팅방 전체 나가기 알림시 이용 가능할 것으로 보임
      // if (globalStomp.isConnected()) {
      //   globalStomp.publish('/app/disconnect', {
      //     userId: userData.userId,
      //     roomId: selectedRoom.id,
      //   });
      // }

    return () => {
    
      // 구독 해제
      globalStomp.unsubscribe(subscriptionId);
    };
  }, [selectedRoom, setMessages, setClient, userData, globalStomp]);
}