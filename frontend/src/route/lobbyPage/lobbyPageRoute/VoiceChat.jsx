import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng'; 
import axios from 'axios';
import './VoiceChat.css'; 

// 음성 채팅 컴포넌트 : 채널 입장/퇴장 및 마이크 제어 기능 포함
function VoiceChat({ channelName, uid }) {  
  const [joined, setJoined] = useState(false);  // 입장 여부 상태
  const [muted, setMuted] = useState(false);    // 음소거 상태
  const clientRef = useRef(null);               // Agora 클라이언트 인스턴스 저장
  const localAudioTrackRef = useRef(null);      // 마이크 오디오 트랙 저장
  const [joinedUserIds, setJoinedUserIds] = useState([]);

  // 채널 입장 함수
  const joinChannel = async () => {

    // 백엔드에서 토큰 요청
    const res = await axios.post('/agora/token', {
      channelName,
      uid,
    });

    const token = res.data.token;

    // Agora 클라이언트 생성
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

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

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio') {
        setJoinedUserIds(prev => prev.filter(id => id !== user.uid));
      }
    });

    client.on('user-left', user => {
      setJoinedUserIds(prev => prev.filter(id => id !== user.uid));
    });

    console.log('AGORA_APP_ID:', import.meta.env.VITE_AGORA_APP_ID);
    console.log('channelName:', channelName);
    console.log('token:', token);
    console.log('uid:', uid);
    console.log('token response:', res.data);s


    // 채널 입장
    await client.join(import.meta.env.VITE_AGORA_APP_ID, channelName, token, uid);

    // 마이크 오디오 트랙 생성
    const localTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localAudioTrackRef.current = localTrack;

    // 오디오 트랙 퍼블리시 (상대방이 내 소리 들을 수 있게)
    await client.publish([localTrack]);
      
    // 상태 변경
    setJoined(true);
    setMuted(false);
  };

  // 채널 퇴장 함수
  const leaveChannel = async () => {
    // 마이크 트랙 정리
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();   // 오디오 중지
      localAudioTrackRef.current.close();  // 리소스 반환
    }

    // 채널에서 나가기
    if (clientRef.current) {
      await clientRef.current.leave();
    }

    // 상태 초기화
    setJoined(false);
    setJoinedUserIds([]); // 퇴장 시 목록 초기화
  };

  // 마이크 음소거 토글
  const toggleMute = async () => {
    if (!localAudioTrackRef.current) return;

    if (muted) {
      await localAudioTrackRef.current.setEnabled(true); // 마이크 다시 켜기
    } else {
      await localAudioTrackRef.current.setEnabled(false); // 마이크 끄기
    }

    setMuted(!muted); // 상태 반전
  };

  return (
    <div className="voice-control-panel">
      {joined ? (
        <>
          <button onClick={leaveChannel}>🎧 퇴장</button>
          <button onClick={toggleMute}>
            {muted ? '🔊 음소거 해제' : '🔇 음소거'}
          </button>
        </>
      ) : (
        <button onClick={joinChannel}>🎙️ 입장</button>
      )}
    </div>
  );
}

export default VoiceChat;
