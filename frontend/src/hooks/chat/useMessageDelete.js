import { useState } from 'react';
import axios from '@axios';

export function useMessageDelete() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const deleteMessage = async (messageId, roomId, isFriendChat = false, messageData = null, userId) => {
        setIsLoading(true);
        setError(null);

        try {
            let endpoint;
            let requestData = {};

            if (isFriendChat) {
                // 친구 채팅 삭제
                endpoint = `/api/friends/chatroom/${roomId}/messages/${messageId}?userId=${userId}`;
            } else {
                // 일반 채팅: 실시간 메시지인지 DB 메시지인지 구분
                if (messageData && messageData.isRealTime) {
                    // 실시간 메시지: senderId와 timestamp 사용
                    endpoint = `/api/chat/rooms/${roomId}/realtime-messages`;
                    requestData = {
                        senderId: messageData.senderId,
                        timestamp: messageData.timestamp,
                        userId: userId
                    };
                } else {
                    // DB 저장된 메시지: 기존 로직 사용
                    endpoint = `/api/chat/rooms/${roomId}/messages/${messageId}?userId=${userId}`;
                }
            }

            const response = requestData.senderId 
                ? await axios.delete(endpoint, { data: requestData })
                : await axios.delete(endpoint);
            
            if (response.status === 200) {
                console.log('메시지 삭제 성공:', response.data);
                return response.data;
            } else {
                throw new Error('메시지 삭제 실패');
            }
        } catch (err) {
            console.error('메시지 삭제 오류:', err);
            if (err.response && err.response.data) {
                console.error('서버 응답:', err.response.data);
                setError(err.response.data.error || err.message);
            } else {
                setError(err.message);
            }
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        deleteMessage,
        isLoading,
        error
    };
}
