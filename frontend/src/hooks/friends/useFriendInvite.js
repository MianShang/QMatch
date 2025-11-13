import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from '@axios';

export function useFriendInvite(room) {
  const [availableFriends, setAvailableFriends] = useState([]);
  const [inviting, setInviting] = useState({});
  const [roomMembers, setRoomMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // 방 참여자 목록 가져오기
  const fetchRoomMembers = useCallback(async () => {
    if (!room) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/get/user/chatlist?roomId=${room.id}`);
      const members = response.data.map(member => member.userId);
      setRoomMembers(members);
    } catch (error) {
      console.error('방 참여자 목록 조회 실패:', error);
      setRoomMembers([]);
    } finally {
      setLoading(false);
    }
  }, [room]);

  // 친구 초대 함수
  const inviteFriend = useCallback(async (friend, userData) => {
    if (!room || !userData) {
      return { success: false, message: '필수 정보가 없습니다.' };
    }

    setInviting(prev => ({ ...prev, [friend.userId]: true }));

    try {
      const friendName = friend.userNickname || friend.userNickName || friend.userName;
      const inviterName = userData.userNickname || userData.userNickName || userData.userName;
      
      const response = await axios.post('/api/chat/rooms/invite-friend', {
        roomId: room.id,
        roomName: room.name,
        inviterId: userData.userId,
        inviterName: inviterName,
        friendId: friend.userId,
        friendName: friendName
      });

      if (response.data.success) {
        toast.success(`${friendName}님에게 초대를 보냈습니다.`);
        return { success: true, message: '초대가 전송되었습니다.' };
      } else {
        toast.error(response.data.message || '초대 전송에 실패했습니다.');
        return { success: false, message: response.data.message || '초대 전송에 실패했습니다.' };
      }
    } catch (error) {
      console.error('친구 초대 오류:', error);
      toast.error('초대 전송 중 오류가 발생했습니다.');
      return { success: false, message: '초대 전송 중 오류가 발생했습니다.' };
    } finally {
      setInviting(prev => ({ ...prev, [friend.userId]: false }));
    }
  }, [room]);

  // 상태 아이콘 반환 함수
  const getStatusIcon = useCallback((status) => {
    const statusIcons = {
      '온라인': '🟢',
      '자리비움': '🟠',
      '오프라인': '🔴'
    };
    return statusIcons[status] || '🔴';
  }, []);

  // 상태 클래스 반환 함수
  const getStatusClass = useCallback((status) => {
    const statusClasses = {
      '온라인': 'status-online',
      '자리비움': 'status-away',
      '오프라인': 'status-offline'
    };
    return statusClasses[status] || 'status-offline';
  }, []);

  return {
    availableFriends,
    setAvailableFriends,
    inviting,
    roomMembers,
    loading,
    fetchRoomMembers,
    inviteFriend,
    getStatusIcon,
    getStatusClass
  };
}
