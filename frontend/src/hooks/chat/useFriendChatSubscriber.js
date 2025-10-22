import { useEffect } from "react";
import axios from "axios";

/**
 * @param {object} globalStomp - STOMP 클라이언트
 * @param {object} selectedFriendRoom - 현재 선택된 친구 채팅방 { roomId, friendId }
 * @param {function} setFriendMessages - 메시지 상태 업데이트 함수
 * @param {Function} setClient    - STOMP 클라이언트 인스턴스를 설정하는 함수
 */

export function useFriendChatSubscriber(selectedFriendRoom, setFriendMessages, globalStomp, setClient) {
    useEffect(() => {
        if (!selectedFriendRoom || !globalStomp) return;

        const subscriptionId = `friend-message-${selectedFriendRoom.roomId}`;

        // 구독 설정
        globalStomp.subscribe(
            `/topic/friends/chat/${selectedFriendRoom.roomId}`,
            (msg) => {
                try {
                    const body = JSON.parse(msg.body);

                    // 메시지 고정 상태 변경인지 확인 (고정 상태가 true인 경우만)
                    if (body.id && body.isPinned === true) {
                        setFriendMessages(prev => {
                            // 새로운 메시지가 고정되면 다른 모든 메시지의 고정 상태를 해제
                            return prev.map(msg => 
                                msg.id === body.id 
                                    ? { ...msg, isPinned: true }
                                    : { ...msg, isPinned: false }
                            );
                        });
                        return;
                    }

                    // 새 메시지인 경우 (ID가 있고 고정 상태가 true가 아닌 경우)
                    if (body.id && body.isPinned !== true) {
                        setFriendMessages((prev) => {
                            // 이미 존재하는 메시지인지 확인
                            if (prev.some((m) => m.id === body.id)) {
                                return prev;
                            }
                            // 새 메시지 추가
                            return [...prev, body];
                        });
                        return;
                    }

                } catch (error) {
                    console.error('친구 채팅 메시지 오류:', error);
                }
            },
            { id: subscriptionId }
        );

        setClient(globalStomp.getClient());

        return () => {
            globalStomp.unsubscribe(subscriptionId);
        };
    }, [globalStomp, selectedFriendRoom, setFriendMessages, setClient])
}