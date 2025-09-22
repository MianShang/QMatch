import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng'; 
import axios from 'axios';
import './VoiceChat.css'; 

import { useSpeakingIndicator } from "../../../hooks/voiceChat/useSpeakingIndicator";

// 음성 채팅 컴포넌트 : 채널 입장/퇴장 및 마이크 제어 기능 포함
const VoiceChat=React.forwardRef(({ uid, onSpeakers, onLocalMuteChange, onJoinChange, onParticipantsChange}, ref) => {  
  const [joined, setJoined] = useState(false);  // 입장 여부 상태
  const [muted, setMuted] = useState(false);    // 음소거 상태
  const clientRef = useRef(null);               // Agora 클라이언트 인스턴스 저장
  const localAudioTrackRef = useRef(null);      // 마이크 오디오 트랙 저장

  const [joinedUserIds, setJoinedUserIds] = useState([]); // 참여자 목록

  const joiningRef = useRef(false);

  // 스피킹 인디케이터
  const speakers = useSpeakingIndicator(clientRef.current);

  // 부모에게 말하는 상태 전달
  useEffect(() => {
    if (onSpeakers) onSpeakers(speakers);
  }, [speakers, onSpeakers]);

  // 참가자 목록이 변경될 때마다 부모 컴포넌트로 전달
  useEffect(() => {
    onParticipantsChange?.(joinedUserIds);
  }, [joinedUserIds, onParticipantsChange]);

  // useImperativeHandle 훅을 사용하여 함수들을 부모에 노출
  useImperativeHandle(ref, () => ({
    leaveChannel,
    joinChannel,
    toggleMute,
  }));

  // 채널 입장 함수
  const joinChannel = async (roomId) => {
    if (joiningRef.current || joined || clientRef.current) return; // 중복 방지

    try {
      // 백엔드에서 토큰 요청
      const { data } = await axios.post('/agora/token', { channelName: `vc_${roomId}`, uid });
      const token = data.token;

      // Agora 클라이언트 생성
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-joined', user => {
        setJoinedUserIds(prev => [...prev, user.uid]);
      });

      client.on('user-left', user => {
        setJoinedUserIds(prev => prev.filter(id => id !== user.uid));
      });

      // "채널 참가/퇴장" 기반으로 목록 관리
      client.on('user-joined',   user => addParticipant(user.uid));
      client.on('user-left',     user => removeParticipant(user.uid));

      // Agora client 이벤트 구독
      client.on('user-published', async (user, mediaType) =>{
        // 구독 요청
        await client.subscribe(user, mediaType);

        if (mediaType === 'audio') {
          // 상대방 오디오 트랙 재생
          user.audioTrack?.play();
        }
      });

      // 채널 입장
      await client.join(import.meta.env.VITE_AGORA_APP_ID, `vc_${roomId}`, token || null, uid);

      setJoinedUserIds([uid]);

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
      console.log("-@#$!#$!@#$!@#$!@$@$!$!#@$@!", channelName);
    }
    catch(e) { // UID 충돌 안내
      if (String(e).includes('UID_CONFLICT')) {
        console.warn('이미 같은 uid가 접속 중. 다른 탭/창이 열려있는지 확인하세요.');
        // 필요시: 몇 초 후 재시도 로직 or 안내 UI
      } else {
        console.error(e);
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
      setJoinedUserIds([]); // 참가자 목록 비우기
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
