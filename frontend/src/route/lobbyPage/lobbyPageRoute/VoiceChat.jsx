import React, { useEffect, useRef, useState, useImperativeHandle, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from '@axios';
import './VoiceChat.css';

import { useSpeakingIndicator } from "../../../hooks/voiceChat/useSpeakingIndicator";

// Agora RTC를 사용한 음성채팅 컴포넌트
// 채널 입장/퇴장, 마이크 제어, 참여자 관리 기능 제공
const VoiceChat = React.forwardRef(({ channelId, uid, onSpeakers, onLocalMuteChange, onJoinChange, onParticipantsChange, roomId, globalStomp, onVoiceChatSwitch }, ref) => {

  // 음성채팅 상태 관리
  const [joined, setJoined] = useState(false);  // 채널 입장 여부
  const [muted, setMuted] = useState(false);    // 로컬 음소거 상태
  const clientRef = useRef(null);               // Agora RTC 클라이언트 인스턴스
  const localAudioTrackRef = useRef(null);      // 로컬 오디오 트랙 참조

  // 참여자 관리
  const [joinedUserIds, setJoinedUserIds] = useState([]); // 참여 중인 사용자 ID 목록
  const joiningRef = useRef(false); // 중복 입장 방지 플래그
  

  // STOMP를 통해 서버에 음성채팅 참여자 정보 전송
  const notifyVoiceParticipantChange = (action, voiceChannelId, customRoomId) => {
    const targetRoomId = customRoomId || roomId;
    if (!targetRoomId || !uid || !globalStomp) return;
    try {
      const destination = action === 'join'
        ? `/app/voice/${targetRoomId}/join`
        : `/app/voice/${targetRoomId}/leave`;

      const payload = { userId: uid, voiceChannelId, roomId: targetRoomId };
      console.log("🔈 STOMP SEND:", destination, payload);

      globalStomp.publish(destination, payload);

    } catch (error) {
      console.error(`음성채팅 ${action} 알림 실패:`, error);
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

  // Agora RTC 채널 입장 처리
  const joinChannel = async (channelId) => {
    // 중복 입장 방지 체크
    if (joiningRef.current || joined || clientRef.current) {
      return;
    }

    joiningRef.current = true;

    // 채널 전환 시 이전 참여자 목록 초기화
    setJoinedUserIds([]);

    try {
      // channelId를 안전하게 문자열로 변환
      const channelIdStr = String(channelId || '');

      // 채널 이름을 Agora 규칙에 맞게 변환 (음성채널 ID 포함)
      let channelName;

      if (channelIdStr && channelIdStr.startsWith('friend_')) {
        const friendIds = channelIdStr.replace('friend_', '').split('_');
        if (friendIds.length >= 2) {
          // 두 친구 ID를 정렬하여 동일한 채널명 생성
          const sortedIds = friendIds.sort();
          channelName = `friend_voice_${sortedIds[0]}_${sortedIds[1]}`.replace(/[^a-zA-Z0-9_]/g, '_');
        } else {
          // 단일 친구 ID인 경우
          channelName = `friend_voice_${friendIds[0]}`.replace(/[^a-zA-Z0-9_]/g, '_');
        }
      } else {
        // 그룹 채팅의 경우
        channelName = `voice_channel_${roomId}_${channelIdStr}`.replace(/[^a-zA-Z0-9_]/g, '_');
      }

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
      client.on('user-joined', user => {
        // 로컬 상태만 업데이트
        setJoinedUserIds(prev => {
          if (!prev.includes(user.uid)) {
            return [...prev, user.uid];
          }
          return prev;
        });
      });

      client.on('user-left', user => {
        // 로컬 상태만 업데이트
        setJoinedUserIds(prev => prev.filter(id => id !== user.uid));
      });

      // Agora client 이벤트 구독
      client.on('user-published', async (user, mediaType) => {
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
      notifyVoiceParticipantChange('join', channelIdStr);

      // 음성채팅 전환 시 전역 상태 업데이트
      if (onVoiceChatSwitch) {
        onVoiceChatSwitch({
          type: 'join',
          channelId: channelIdStr,
          roomId: roomId
        });
      }

      // 로컬 상태만 업데이트 (userName은 WebSocket에서 제공하므로 Agora 이벤트는 무시)

    }
    catch (e) { // UID 충돌 안내
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

// Agora RTC 채널 퇴장 처리
  async function leaveChannel(forceRoomId = roomId) {
    try {
      // channelId를 안전하게 문자열로 변환
      const channelIdStr = String(channelId || '');

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
      notifyVoiceParticipantChange('leave', channelIdStr, forceRoomId);


      // 음성채팅 전환 시 전역 상태 업데이트
      if (onVoiceChatSwitch) {
        onVoiceChatSwitch({
          type: 'leave',
          channelId: channelIdStr,
          roomId: forceRoomId
        });
      }

      // 로컬 상태만 업데이트
      setJoinedUserIds([]);
    } catch (error) {
      console.error('음성채팅 퇴장 중 오류:', error);
    } finally {
      setMuted(false);
      setJoined(false);
    }
  }

  // 마이크 음소거 상태 토글 처리
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
