import React, { useEffect, useRef, useState, useImperativeHandle, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng'; 
import axios from 'axios';
import './VoiceChat.css'; 

import { useSpeakingIndicator } from "../../../hooks/voiceChat/useSpeakingIndicator";

// 음성 채팅 컴포넌트 : 채널 입장/퇴장 및 마이크 제어 기능 포함
const VoiceChat=React.forwardRef(({ channelId, uid, onSpeakers, onLocalMuteChange, onJoinChange, onParticipantsChange, roomId, globalStomp}, ref) => {
  
  const [joined, setJoined] = useState(false);  // 입장 여부 상태
  const [muted, setMuted] = useState(false);    // 음소거 상태
  const clientRef = useRef(null);               // Agora 클라이언트 인스턴스 저장
  const localAudioTrackRef = useRef(null);      // 마이크 오디오 트랙 저장

  const [joinedUserIds, setJoinedUserIds] = useState([]);

  const joiningRef = useRef(false);

  // 참여자 목록 변경을 부모에게 직접 알림하는 함수
  const notifyParticipantsChange = useCallback((participants) => {
    if (onParticipantsChange) {
      onParticipantsChange(participants);
    }
  }, [onParticipantsChange]);



  // 서버에 음성채팅 참여자 정보 알림 (STOMP 사용)
  const notifyVoiceParticipantChange = (action, voiceChannelId) => {
    if (!roomId || !uid || !globalStomp) return;
    
    try {
      const destination = action === 'join' 
        ? `/app/voice/${roomId}/join`
        : `/app/voice/${roomId}/leave`;
      
      const payload = {
        userId: uid,
        voiceChannelId: voiceChannelId,
        roomId: roomId
      };
      
      // useGlobalStomp의 publish 함수 사용 (destination, body)
      globalStomp.publish(destination, payload);
      
    } catch (error) {
      console.error(`음성채팅 참여자 ${action} 알림 실패:`, error);
    }
  };

  // 스피킹 인디케이터
  const speakers = useSpeakingIndicator(clientRef.current);

  // 부모에게 말하는 상태 전달
  useEffect(() => {
    if (onSpeakers) onSpeakers(speakers);
  }, [speakers, onSpeakers]);


  // useImperativeHandle 훅을 사용하여 함수들을 부모에 노출
  useImperativeHandle(ref, () => ({
    leaveChannel,
    joinChannel,
    toggleMute,
  }));

  // 채널 입장 함수
  const joinChannel = async (channelId) => {
    if (joiningRef.current || joined || clientRef.current) {
      return; // 중복 방지
    }

    joiningRef.current = true; // 즉시 플래그 설정
    
    // 채널 전환 시 이전 참여자 목록 초기화
    setJoinedUserIds([]);
    
    try {
      // 채널 이름을 Agora 규칙에 맞게 변환 (음성채널 ID 포함)
      // Agora 채널 이름 규칙: 1-64자, a-z,A-Z,0-9,space,!, #, $, %, &, (, ), +, -, :, ;, <, =, ., >, ?, @, [, ], ^, _, {, }, |, ~
      let channelName = `voice_channel_${roomId}_${channelId}`.replace(/[^a-zA-Z0-9_]/g, '_');
      
      // 채널 이름 길이 제한 (64자)
      if (channelName.length > 64) {
        channelName = channelName.substring(0, 64);
      }
      
      // 최소 길이 보장 (1자 이상)
      if (channelName.length === 0) {
        channelName = 'voice_channel_default';
      }
      
      
      // 백엔드에서 토큰 요청
      const { data } = await axios.post('/agora/token', { channelName, uid });
      const token = data.token;

      // Agora 클라이언트 생성
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      // Agora 이벤트는 로컬 상태만 업데이트, 실제 참여자 관리는 WebSocket으로 처리
      client.on('user-joined',   user => {
        // 로컬 상태만 업데이트
        setJoinedUserIds(prev => {
          if (!prev.includes(user.uid)) {
            return [...prev, user.uid];
          }
          return prev;
        });
      });
      
      client.on('user-left',     user => {
        // 로컬 상태만 업데이트
        setJoinedUserIds(prev => prev.filter(id => id !== user.uid));
      });

      // Agora client 이벤트 구독
      client.on('user-published', async (user, mediaType) =>{
        // 구독 요청
        await client.subscribe(user, mediaType);

        if (mediaType === 'audio') {
          // 상대방 오디오 트랙 재생
          user.audioTrack?.play();
          
          // 참여자 목록은 user-joined 이벤트에서 이미 관리됨
        }
      });

      // 채널 입장
      await client.join(import.meta.env.VITE_AGORA_APP_ID, channelName, token, uid);

      // 볼륨 이벤트 켜기 (스피킹 인디케이터용)
      client.enableAudioVolumeIndicator();

      // 마이크 오디오 트랙 생성
      const localTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioTrackRef.current = localTrack;

      // 오디오 트랙 퍼블리시 (상대방이 내 소리 들을 수 있게)
      await client.publish([localTrack]);
        
      // 상태 변경
      setJoined(true);
      setMuted(false);
      onLocalMuteChange?.(false);
      onJoinChange?.(true);
      
      // 서버에 음성채팅 참여자 입장 알림 (WebSocket으로 참여자 목록 동기화)
      notifyVoiceParticipantChange('join', channelId);
      
      // 로컬 상태만 업데이트 (userName은 WebSocket에서 제공하므로 Agora 이벤트는 무시)
      
    }
    catch(e) { // UID 충돌 안내
      if (String(e).includes('UID_CONFLICT')) {
        console.warn('이미 같은 uid가 접속 중. 다른 탭/창이 열려있는지 확인하세요.');
        // 필요시: 몇 초 후 재시도 로직 or 안내 UI
      } else {
        console.error('음성채널 입장 실패:', e);
      }
    } finally {
      joiningRef.current = false;
    }
  };

  // 채널 퇴장 함수
  async function leaveChannel() {
    try {
      // 원격 전송 중단
      if (clientRef.current && localAudioTrackRef.current) {
        await clientRef.current.unpublish([localAudioTrackRef.current]);
      }

      // 마이크 트랙 정리
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      // 채널 퇴장 + 리스너 제거
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }

      onLocalMuteChange?.(false);
      onSpeakers?.({});     // speaking 지도 비우기
      onJoinChange?.(false);
      
      // 서버에 음성채팅 참여자 퇴장 알림 (WebSocket으로 참여자 목록 동기화)
      notifyVoiceParticipantChange('leave', channelId);
      
      // 로컬 상태만 업데이트
      setJoinedUserIds([]);
    } finally {
      setMuted(false);
      setJoined(false);
    }
  }

  // 마이크 음소거 토글
  const toggleMute = async () => {
    if (!localAudioTrackRef.current) return;

    const next = !muted;
    await localAudioTrackRef.current.setEnabled(!next);
    setMuted(next);
    onLocalMuteChange?.(next);
  };

  return null;
});

export default VoiceChat;
