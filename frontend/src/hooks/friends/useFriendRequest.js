import { useState } from 'react';
import axios from '@axios';

export function useFriendRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendRequest = async (requesterId, addresseeId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/friends/request', null, {
        params: {
          requesterId: requesterId,
          addresseeId: addresseeId
        }
      });
      setLoading(false);
      return { success: true, message: response.data };
    } catch (err) {
      setLoading(false);
      setError(err.response?.data || '알 수 없는 오류');
      return { success: false, message: err.response?.data || '알 수 없는 오류' };
    }
  };

  return { sendRequest, loading, error };
}