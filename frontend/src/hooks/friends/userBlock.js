import axios from 'axios';

export function blockUser()
{
    const sendBlockRequest = async (requesterId, blockedId) => {
    try {
      const response = await axios.post('/api/friends/block',null, {
        params: {
          requesterId: requesterId,
          blockedId : blockedId
        }
        
    }); return { success: true, message: response.data };
    } catch (err) {
      return { success: false, message: err.response?.data || '알 수 없는 오류' };
    }
  };

  return { sendBlockRequest };
}