import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * 전역 STOMP 클라이언트를 관리하는 커스텀 훅
 * 모든 WebSocket 연결을 하나의 클라이언트로 통합하여 연결 충돌을 방지
 */
export function useGlobalStomp(userData) {
  const stompRef = useRef(null);
  const subscriptionsRef = useRef(new Map()); // 구독 관리용 Map
  const connectionPromiseRef = useRef(null);

  // STOMP 클라이언트 초기화
  const initializeStomp = useCallback(() => {
    // 이미 활성화되어 있고 연결되어 있으면 재사용
    if (stompRef.current?.active && stompRef.current?.connected) {
      return Promise.resolve(stompRef.current);
    }

    // 비활성화된 클라이언트가 있으면 정리
    if (stompRef.current && !stompRef.current.active) {
      try {
        stompRef.current.deactivate();
      } catch (e) {
        // 이미 비활성화된 경우 무시
      }
      stompRef.current = null;
      connectionPromiseRef.current = null;
    }

    if (connectionPromiseRef.current) {
      return connectionPromiseRef.current;
    }

    const BASE_URL = import.meta.env?.VITE_API_URL;
    
    const stomp = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/gs-guide-websocket`),
      reconnectDelay: 5000,
      connectHeaders: userData ? { userId: userData.userId } : {},
      onConnect: () => {
        console.log('전역 STOMP 클라이언트 연결 성공');
      },
      onDisconnect: () => {
        console.log('전역 STOMP 클라이언트 연결 해제');
        subscriptionsRef.current.clear();
      },
      onStompError: (frame) => {
        console.error('STOMP 오류:', frame);
      }
    });

    stompRef.current = stomp;
    
    connectionPromiseRef.current = new Promise((resolve, reject) => {
      stomp.onConnect = () => {
        console.log('전역 STOMP 클라이언트 연결 성공');
        resolve(stomp);
      };
      
      stomp.onStompError = (frame) => {
        console.error('STOMP 연결 오류:', frame);
        reject(frame);
        connectionPromiseRef.current = null;
      };
      
      stomp.activate();
    });

    return connectionPromiseRef.current;
  }, [userData]);

  // 로그인 즉시 웹소켓 연결, 로그아웃 시 정리
  useEffect(() => {
    if (userData?.userId) {
      initializeStomp().catch(error => {
        console.error('로그인 시 웹소켓 연결 실패:', error);
      });
    } else {
      // userData가 null이면 (로그아웃) STOMP 클라이언트 완전히 정리
      if (stompRef.current) {
        try {
          if (stompRef.current.active) {
            stompRef.current.deactivate();
          }
        } catch (e) {
          console.warn('STOMP 클라이언트 정리 중 오류:', e);
        }
        stompRef.current = null;
        connectionPromiseRef.current = null;
        subscriptionsRef.current.clear();
      }
    }
  }, [userData?.userId, initializeStomp]);

  // 구독 함수
  const subscribe = useCallback(async (destination, callback, options = {}) => {
    try {
      console.log('📡 [구독 시도]', destination);
      // 웹소켓 연결 대기
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        const stomp = await initializeStomp();
        
        if (stomp.connected) {
          const subscription = stomp.subscribe(destination, callback, options);
          const subscriptionId = options.id || destination;
          
          // 기존 구독이 있다면 해제
          if (subscriptionsRef.current.has(subscriptionId)) {
            subscriptionsRef.current.get(subscriptionId).unsubscribe();
          }
          
          subscriptionsRef.current.set(subscriptionId, subscription);
          console.log('✅ [구독 성공]', destination, 'ID:', subscriptionId);
          return subscription;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      console.error('❌ [구독 실패] 연결 시간 초과:', destination);
      return null;
    } catch (error) {
      console.error('❌ [구독 실패]', destination, error);
      return null;
    }
  }, [initializeStomp]);

  // 구독 해제 함수
  const unsubscribe = useCallback((subscriptionId) => {
    if (subscriptionsRef.current.has(subscriptionId)) {
      subscriptionsRef.current.get(subscriptionId).unsubscribe();
      subscriptionsRef.current.delete(subscriptionId);
    }
  }, []);

  // 메시지 발행 함수
  const publish = useCallback(async (destination, body, headers = {}) => {
    try {
      const stomp = await initializeStomp();
      
      if (!stomp.connected) {
        console.warn('STOMP 클라이언트가 연결되지 않음');
        return false;
      }

      stomp.publish({
        destination,
        body: typeof body === 'string' ? body : JSON.stringify(body),
        ...headers
      });
      return true;
    } catch (error) {
      console.error('메시지 발행 실패:', error);
      return false;
    }
  }, [initializeStomp]);

  // 연결 상태 확인
  const isConnected = useCallback(() => {
    return stompRef.current?.connected || false;
  }, []);

  // 클라이언트 인스턴스 반환
  const getClient = useCallback(() => {
    return stompRef.current;
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 모든 구독 해제
      subscriptionsRef.current.forEach(subscription => {
        subscription.unsubscribe();
      });
      subscriptionsRef.current.clear();
      
      // STOMP 클라이언트 비활성화
      if (stompRef.current?.active) {
        stompRef.current.deactivate();
      }
      
      connectionPromiseRef.current = null;
    };
  }, []);

  return {
    subscribe,
    unsubscribe,
    publish,
    isConnected,
    getClient,
    initializeStomp
  };
}