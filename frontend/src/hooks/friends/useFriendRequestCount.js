import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export function useFriendRequestCount(userData, globalStomp) {
  const [pendingCount, setPendingCount] = useState(0);

  // 친구 요청 개수 조회 (재시도 로직 포함)
  const fetchPendingCount = async (retryCount = 0) => {
    if (!userData?.userId) return;
    
    try {
      const response = await axios.get('/api/friends/pending-count', {
        params: { userId: userData.userId },
        timeout: 5000 // 5초 타임아웃
      });
      setPendingCount(response.data || 0);
    } catch (error) {
      console.error('친구 요청 개수 조회 실패:', error);
      
      // 재시도 로직 (최대 2번)
      if (retryCount < 2) {
        setTimeout(() => fetchPendingCount(retryCount + 1), 1000);
      } else {
        setPendingCount(0);
      }
    }
  };

  // 초기 로딩 및 userData 변경 시 조회
  useEffect(() => {
    fetchPendingCount();
  }, [userData?.userId]);

  // 주기적으로 친구 요청 개수 업데이트 (30초마다)
  useEffect(() => {
    if (!userData?.userId) return;

    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [userData?.userId]);

  // WebSocket으로 친구 요청 상태 변경 구독
  useEffect(() => {
    if (!userData?.userId || !globalStomp) return;

    const subscriptionId = `friend-request-count-${userData.userId}`;
    
    // 친구 요청 관련 이벤트 구독 (토스트 알림과 개수 업데이트 모두 처리)
    globalStomp.subscribe(`/topic/friends/${userData.userId}`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);
        console.log('친구 요청 상태 변경 알림:', payload);
        
        // 토스트 알림 표시
        toast.info(payload.message || "새로운 친구 요청이 도착했습니다.");
        
        // 친구 요청 상태가 변경되면 개수 새로고침
        fetchPendingCount();
      } catch (error) {
        console.error('친구 요청 알림 처리 오류:', error);
      }
    }, { id: subscriptionId });

    return () => {
      globalStomp.unsubscribe(subscriptionId);
    };
  }, [userData?.userId, globalStomp]);

  return { pendingCount, refreshPendingCount: fetchPendingCount };
}
