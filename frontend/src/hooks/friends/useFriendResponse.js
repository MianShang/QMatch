import axios from 'axios';

export async function useFriendResponse(ResponseId,userId,ResponseStatus)
{
    try {
      const response = await axios.post(`/api/friends/${ResponseStatus}`,null, {
        params: {
          responseId: ResponseId,
          userId: userId,
        }
        
    }); return { success: true, message: response.data };
    } catch (err) {
      return { success: false, message: err.response?.data || '알 수 없는 오류' };
    }
};
