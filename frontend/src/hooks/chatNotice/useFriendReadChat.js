import { useCallback, useEffect } from "react";
import axios from "axios";

/**
 * 친구 채팅 읽음 처리 훅
 * @param {object} selectedFriendRoom - 현재 선택된 채팅방 { roomId, friendId }
 * @param {object} userData - 현재 로그인한 사용자 데이터 { userId }
 */
export function useFriendReadChat(selectedFriendRoom, userData) {


    const setFriendRead = useCallback(async () => {
        if (!selectedFriendRoom?.roomId || !userData?.userId) return;

        try {
            await axios.delete(`/api/friends/chatroom/unread/message/${selectedFriendRoom.roomId}`, {
                params: { receiveId: userData.userId },
            });
        } catch (err) {
            console.error("읽음 처리 실패:", err);
        }
    }, [selectedFriendRoom?.roomId, userData?.userId]);

    // 2. 방이 바뀔 때 자동 실행
    useEffect(() => {
        if (selectedFriendRoom?.roomId) {
            setFriendRead();
        }
    }, [selectedFriendRoom, setFriendRead]);

    return setFriendRead;
}