import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng'; 
import axios from 'axios';
import './VoiceChat.css'; 

import { useSpeakingIndicator } from "../../../hooks/voiceChat/useSpeakingIndicator";

// 음성 채팅 컴포넌트 : 채널 입장/퇴장 및 마이크 제어 기능 포함
function VoiceChat({ channelName, uid, onSpeakers, onLocalMuteChange, onJoinChange, onVoiceParticipantsChange }) {  
  const [joined, setJoined] = useState(false);  // 입장 여부 상태
  const [muted, setMuted] = useState(false);    // 음소거 상태
  const clientRef = useRef(null);               // Agora 클라이언트 인스턴스 저장
  const localAudioTrackRef = useRef(null);      // 마이크 오디오 트랙 저장

  const [joinedUserIds, setJoinedUserIds] = useState([]);

  const joiningRef = useRef(false);

  // 스피킹 인디케이터
  const speakers = useSpeakingIndicator(clientRef.current);

  // 부모에게 말하는 상태 전달
  useEffect(() => {
    if (onSpeakers) onSpeakers(speakers);
  }, [speakers, onSpeakers]);

  // joinedUserIds가 바뀌면 부모에 알려주기 (문자열 uid로 통일)
  useEffect(() => {
    const uniq = Array.from(new Set(joinedUserIds.map(x => String(x))));
    onVoiceParticipantsChange?.(uniq);
  }, [joinedUserIds, onVoiceParticipantsChange]);

  // 헬퍼
  function addParticipant(id) {
    const k = String(id);
    setJoinedUserIds(prev => {
      const s = new Set(prev.map(String));
      s.add(k);
      return Array.from(s);
    });
  }
  function removeParticipant(id) {
    const k = String(id);
    setJoinedUserIds(prev => prev.filter(x => String(x) !== k));
  }

  // 채널 입장 함수
  const joinChannel = async () => {
    if (joiningRef.current || joined || clientRef.current) return; // 중복 방지

    try {
      // 백엔드에서 토큰 요청
      const { data } = await axios.post('/agora/token', { channelName, uid });
      const token = data.token;

      // Agora 클라이언트 생성
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

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

          // 목록에 추가
          setJoinedUserIds(prev => [...prev, user.uid]);
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

      // 로컬 uid 목록에 추가
      addParticipant(uid);
        
      // 상태 변경
      setJoined(true);
      setMuted(false);
      onLocalMuteChange?.(false);
      onJoinChange?.(true);
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

  return (
    <div className="voice-control-panel">
      {joined ? (
        <>
          <button onClick={leaveChannel}>🎧 퇴장</button>
          <button onClick={toggleMute}>
            {muted ? '🔊' : '🔇'}
          </button>
        </>
      ) : (
        <button onClick={joinChannel}>🎙️ 입장</button>
      )}
    </div>
  );
}

export default VoiceChat;
