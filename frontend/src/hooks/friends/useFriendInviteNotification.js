import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

export function useFriendInviteNotification() {
  const [processing, setProcessing] = useState(false);

  // 초대 수락 함수
  const acceptInvite = useCallback(async (inviteData, onAccept, onClose) => {
    if (!inviteData) return;

    setProcessing(true);
    
    try {
      const response = await axios.post('/api/chat/rooms/accept-invite', {
        roomId: inviteData.roomId,
        userId: inviteData.userId
      });

      if (response.data.success) {
        toast.success('방에 입장했습니다!');
        
        // 수락 성공 콜백 호출 (방 입장 처리)
        if (onAccept) {
          onAccept(inviteData);
        }
        
        onClose();
      } else {
        toast.error(response.data.message || '방 입장에 실패했습니다.');
      }
    } catch (error) {
      console.error('초대 수락 오류:', error);
      toast.error('방 입장 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }, []);

  // 초대 거절 함수
  const rejectInvite = useCallback(async (inviteData, onClose) => {
    if (!inviteData) return;

    setProcessing(true);
    
    try {
      await axios.post('/api/chat/rooms/reject-invite', {
        roomId: inviteData.roomId,
        userId: inviteData.userId
      });
      
      toast.info('초대를 거절했습니다.');
      onClose();
    } catch (error) {
      console.error('초대 거절 오류:', error);
      toast.error('초대 거절 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }, []);

  // 방 이름의 첫 글자로 아바타 생성
  const getRoomAvatar = useCallback((roomName) => {
    return roomName ? roomName.charAt(0).toUpperCase() : 'R';
  }, []);

  return {
    processing,
    acceptInvite,
    rejectInvite,
    getRoomAvatar
  };
}
