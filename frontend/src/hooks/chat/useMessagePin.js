import { useState } from 'react';
import axios from 'axios';

export function useMessagePin() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const togglePinMessage = async (messageId, roomId, isFriendChat = false, messageData = null) => {
        setIsLoading(true);
        setError(null);

        try {
            let endpoint;
            let requestData = {};

            if (isFriendChat) {
                // 친구 채팅은 기존 로직 유지
                endpoint = `/api/friends/chatroom/${roomId}/messages/${messageId}/pin`;
            } else {
                // 일반 채팅: 실시간 메시지인지 DB 메시지인지 구분
                if (messageData && messageData.isRealTime) {
                    // 실시간 메시지: senderId와 timestamp 사용
                    endpoint = `/api/chat/rooms/${roomId}/realtime-messages/pin`;
                    requestData = {
                        senderId: messageData.senderId,
                        timestamp: messageData.timestamp,
                        isPinned: !messageData.isPinned // 현재 상태의 반대로 토글
                    };
                } else {
                    // DB 저장된 메시지: 기존 로직 사용
                    endpoint = `/api/chat/rooms/${roomId}/messages/${messageId}/pin`;
                }
            }

            const response = requestData.senderId 
                ? await axios.put(endpoint, requestData)
                : await axios.put(endpoint);
            
            if (response.status === 200) {
                console.log('메시지 고정/해제 성공:', response.data);
                return response.data;
            } else {
                throw new Error('메시지 고정/해제 실패');
            }
        } catch (err) {
            console.error('메시지 고정/해제 오류:', err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        togglePinMessage,
        isLoading,
        error
    };
}
