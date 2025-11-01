import axios from "@axios";

/**
 * 특정 친구 채팅방의 안읽은 메시지 개수 조회
 * @param {string} roomId - 채팅방 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise<number>} 안읽은 메시지 개수
 */
export async function getFriendUnReadChatCount(roomId, userId) {
    if (!roomId || !userId) return 0;
    try {
        const response = await axios.get(`/api/friends/chatroom/${roomId}/unread-count`, {
            params: { userId },
        });
        return response.data || 0;
    } catch (e) {
        console.error("친구 메시지 카운트 처리 실패:", e);
        return 0;
    }
}