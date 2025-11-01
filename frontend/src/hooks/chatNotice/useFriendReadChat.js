import { useCallback, useEffect } from "react";
import axios from "@axios";

/**
 * 친구 채팅 읽음 처리 훅
 * @param {object} selectedFriendRoom - 현재 선택된 채팅방 { roomId, friendId }
 * @param {object} userData - 현재 로그인한 사용자 데이터 { userId }
 * @param {array} messages - 현재 방 메시지 배열 (마지막 메시지 id 필요함)
 */
export function useFriendReadChat(selectedFriendRoom, userData, messages) {
  const setFriendRead = useCallback(async () => {
    if (!selectedFriendRoom?.roomId || !userData?.userId || !messages?.length) return;

    const lastMessageId = messages[messages.length - 1].id;

    try {
      await axios.post(`/api/friends/chatroom/${selectedFriendRoom.roomId}/read`, null, {
        params: {
          userId: userData.userId,
          lastReadMessageId: lastMessageId,
        },
      });
    } catch (err) {
      console.error("읽음 처리 실패:", err);
    }
  }, [selectedFriendRoom?.roomId, userData?.userId, messages]);

  useEffect(() => {
    if (selectedFriendRoom?.roomId && messages?.length) {
      setFriendRead();
    }
  }, [selectedFriendRoom, messages, setFriendRead]);

  return setFriendRead;
}