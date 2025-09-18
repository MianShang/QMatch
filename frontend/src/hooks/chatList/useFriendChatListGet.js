import axios from 'axios';

export function useFriendChatListGet(friendRoomId, setMessages) {
    axios.get(`/api/friends/chatroom/${friendRoomId}/messages`,
        {
            params: { roomId: friendRoomId }
        })
        .then((res) =>
            setMessages(res.data)
        ).catch((err) => {
      console.error('채팅 내역 불러오기 실패', err);
    });
}