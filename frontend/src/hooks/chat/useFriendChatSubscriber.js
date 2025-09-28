import { useEffect } from "react";
import axios from "axios";

/**
 * @param {object} globalStomp - STOMP 클라이언트
 * @param {object} selectedFriendRoom - 현재 선택된 친구 채팅방 { roomId, friendId }
 * @param {function} setFriendMessages - 메시지 상태 업데이트 함수
 * @param {Function} setClient    - STOMP 클라이언트 인스턴스를 설정하는 함수
 */

export function useFriendChatSubscriber(selectedFriendRoom, setFriendMessages, globalStomp, setClient, userData) {
    useEffect(() => {
        if (!selectedFriendRoom || !globalStomp) return;

        const subscriptionId = `friend-message-${selectedFriendRoom.roomId}`;

        // 구독 설정
        globalStomp.subscribe(
            `/topic/friends/chat/${selectedFriendRoom.roomId}`,
            (msg) => {
                try {
                    const body = JSON.parse(msg.body);

                    setFriendMessages((prev) =>
                        prev.some((m) => m.id === body.id) ? prev : [...prev, body]);
                    // 현재 방 열려있으면 → 읽음 처리
                    if (selectedFriendRoom?.roomId === body.chatroomId) {
                        axios.post(`/api/friends/chatroom/${selectedFriendRoom.roomId}/read`, null, {
                            params: {
                                userId: userData.userId,
                                lastReadMessageId: body.id,
                            },
                        });
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