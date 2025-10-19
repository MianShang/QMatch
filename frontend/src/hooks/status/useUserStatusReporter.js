import { useEffect, useState, useRef } from 'react';
import axios from '@axios';

export default function useUserStatusReporter(userId) {
  // 초기값 한글로 통일
  const [status, setStatus] = useState('오프라인');
  const lastActivity = useRef(Date.now());
  const isManualStatus = useRef(false);

  useEffect(() => {
    if (!userId) return;

    let checkInterval;

    // 마우스, 키보드 입력이 있을 때 활동 시간 갱신
    const updateActivity = () => {
      lastActivity.current = Date.now();
    };
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);

    function checkStatus() {
      // 수동으로 상태가 설정된 경우 로직을 실행하지 않음
      if (isManualStatus.current) {
        return;
      }

      const idleTime = Date.now() - lastActivity.current;
      let newStatus = idleTime > 10 * 1000 ? '자리비움' : '온라인';

      if (newStatus !== status) {
        setStatus(newStatus);
        axios.post('/api/user/status', {
          userId,
          status: newStatus
        }).catch(() => {});
      }
    }

    checkInterval = setInterval(checkStatus, 1000);
    checkStatus();

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [userId, status]);

  const manuallySetStatus = (newStatus) => {
    isManualStatus.current = newStatus !== '온라인';
    setStatus(newStatus);
    axios.post('/api/user/status', { 
      userId, 
      status: newStatus 
    })
      .then(() => console.log(`상태가 ${newStatus}로 수동 변경됨`))
      .catch(() => console.error('상태 변경 실패'));
  };

  return [status, manuallySetStatus];
}
