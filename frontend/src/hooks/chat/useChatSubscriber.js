// hooks/useChatSubscriber.js
import { useEffect } from 'react';
import axios from 'axios';

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
    
    // 채팅방 구독 시 읽음 처리 (일렉트론 재연결 시 읽음 상태 재확인)
    if (userData?.userId && selectedRoom?.id) {
      axios.post('/api/chat/read', {
        userId: userData.userId,
        chatRoom: selectedRoom.id
      })
      .then(() => {
        console.log('채팅방 재입장 읽음 처리 성공');
      })
      .catch((err) => {
        console.error('채팅방 재입장 읽음 처리 실패:', err);
      });
    }
    
    // 채팅 메시지 구독
    globalStomp.subscribe(
      `/topic/chat/${selectedRoom.id}`,
      (msg) => {
        try {
          const messageData = JSON.parse(msg.body);
          
          // 실시간 메시지 삭제인지 확인
          if (messageData.type === 'realtime-message-deleted') {
            setMessages(prev => {
              return prev.map(msg => {
                // senderId와 timestamp가 일치하는 실시간 메시지 찾기
                if (msg.senderId === messageData.senderId && msg.timestamp === messageData.timestamp) {
                  return { 
                    ...msg, 
                    message: "삭제된 메시지입니다",
                    userName: "DELETED"
                    // name(senderId)는 원래 작성자 정보로 유지
                  };
                }
                return msg;
              });
            });
            return;
          }

          // DB 메시지 삭제인지 확인
          if (messageData.type === 'message-deleted') {
            setMessages(prev => {
              return prev.map(msg => {
                if (msg.id === messageData.messageId) {
                  return { 
                    ...msg, 
                    message: "삭제된 메시지입니다",
                    userName: "DELETED"
                    // name은 원래 작성자 정보로 유지
                  };
                }
                return msg;
              });
            });
            return;
          }

          // 실시간 메시지 고정 상태 변경인지 확인
          if (messageData.type === 'realtime-pin-toggle') {
            setMessages(prev => {
              return prev.map(msg => {
                // senderId와 timestamp가 일치하는 실시간 메시지 찾기
                if (msg.senderId === messageData.senderId && msg.timestamp === messageData.timestamp) {
                  return { ...msg, isPinned: messageData.isPinned };
                }
                // 다른 메시지들은 고정 해제 (한 번에 하나만 고정 가능)
                if (messageData.isPinned) {
                  return { ...msg, isPinned: false };
                }
                return msg;
              });
            });
            return;
          }

          // DB 메시지 고정 상태 변경인지 확인 (ID가 있고 기존 메시지 업데이트)
          if (messageData.id && messageData.isPinned !== undefined) {
            setMessages(prev => {
              // 새로운 메시지가 고정되면 다른 모든 메시지의 고정 상태를 해제
              if (messageData.isPinned) {
                return prev.map(msg => 
                  msg.id === messageData.id 
                    ? { ...msg, isPinned: true }
                    : { ...msg, isPinned: false }
                );
              } else {
                // 메시지가 해제되면 해당 메시지만 해제
                return prev.map(msg => 
                  msg.id === messageData.id 
                    ? { ...msg, isPinned: false }
                    : msg
                );
              }
            });
            return;
          }
          
          // 새 메시지인 경우
          // 시간 정보가 없으면 현재 시간 추가
          if (!messageData.chatDate) {
            messageData.chatDate = new Date().toISOString();
          }
          
          // 실시간 메시지인 경우 (자신이 보낸 메시지가 아닌 경우) 읽음 처리
          // 채팅방에 입장해있는 상태에서 받은 실시간 메시지는 자동으로 읽음 처리
          if (messageData.isRealTime && messageData.senderId !== userData?.userId && selectedRoom?.id) {
            axios.post('/api/chat/read', {
              userId: userData?.userId,
              chatRoom: selectedRoom.id
            })
            .then(() => {
              console.log('실시간 메시지 읽음 처리 성공');
            })
            .catch((err) => {
              console.error('실시간 메시지 읽음 처리 실패:', err);
            });
          }
          
          // Message State Set
          setMessages(prev => [...prev, messageData]);
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
      if (globalStomp.isConnected()) {
        globalStomp.publish('/app/disconnect', {
          userId: userData?.userId,
          roomId: selectedRoom?.id,
        });
      }

    return () => {
    
      // 구독 해제
      globalStomp.unsubscribe(subscriptionId);
    };
  }, [selectedRoom, setMessages, setClient, userData, globalStomp]);
}