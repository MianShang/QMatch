import { useEffect } from "react";


/**
 * @param {object} client - STOMP 클라이언트
 * @param {object} selectedFriendRoom - 현재 선택된 친구 채팅방 { roomId, friendId }
 * @param {function} setFriendMessages - 메시지 상태 업데이트 함수
 */

export function useFriendChatSubscriber(client, selectedFriendRoom, setFriendMessages) {
    useEffect(() => {
        if (!client || !selectedFriendRoom) return;

        // 구독 설정
        const subscribe = client.subscribe(
            `/topic/friends/chat/${selectedFriendRoom.roomId}`,
            (msg) => {
                try {
                    const body = JSON.parse(msg.body);
                    setFriendMessages(prev => [...prev, body]);
                } catch (error) {
                    console.error('친구 채팅 메시지 오류:', error);
                }
            });

        return () => {
            subscribe.unsubscribe();
            console.log('친구 채팅 구독 해제');
        };
    }, [client, selectedFriendRoom, setFriendMessages])
}