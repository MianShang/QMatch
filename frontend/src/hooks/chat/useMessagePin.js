import { useState } from 'react';
import axios from 'axios';

export function useMessagePin() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const togglePinMessage = async (messageId, roomId, isFriendChat = false) => {
        setIsLoading(true);
        setError(null);

        try {
            const endpoint = isFriendChat 
                ? `/api/friends/chatroom/${roomId}/messages/${messageId}/pin`
                : `/api/chat/rooms/${roomId}/messages/${messageId}/pin`;

            const response = await axios.put(endpoint);
            
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
