import { useEffect } from "react";
import axios from "@axios";

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

                    // 친구 메시지 삭제인지 확인
                    if (body.type === 'friend-message-deleted') {
                        setFriendMessages(prev => {
                            return prev.map(msg => {
                                if (msg.id === body.messageId) {
                                    return { 
                                        ...msg, 
                                        message: "삭제된 메시지입니다",
                                        isDeleted: true
                                        // name과 userName은 원래 작성자 정보로 유지
                                    };
                                }
                                return msg;
                            });
                        });
                        return;
                    }

                    // DB 메시지 고정 상태 변경 또는 새 메시지 처리
                    // 시간 정보가 없으면 현재 시간 추가
                    if (!body.chatDate) {
                        body.chatDate = new Date().toISOString();
                    }
                    
                    setFriendMessages((prev) => {
                        // 기존 메시지 목록에 해당 ID가 있는지 확인
                        const existingMessage = prev.find(msg => msg.id === body.id);
                        
                        if (existingMessage) {
                            // 기존 메시지인 경우
                            // 고정 상태 변경인지 확인
                            if (body.isPinned !== undefined) {
                                // 새로운 메시지가 고정되면 다른 모든 메시지의 고정 상태를 해제
                                if (body.isPinned) {
                                    return prev.map(msg => 
                                        msg.id === body.id 
                                            ? { ...msg, isPinned: true }
                                            : { ...msg, isPinned: false }
                                    );
                                } else {
                                    // 메시지가 해제되면 해당 메시지만 해제
                                    return prev.map(msg => 
                                        msg.id === body.id 
                                            ? { ...msg, isPinned: false }
                                            : msg
                                    );
                                }
                            }
                            // 고정 상태 변경이 아니면 기존 메시지 유지
                            return prev;
                        } else {
                            // 새 메시지인 경우 추가
                            return [...prev, body];
                        }
                    });

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