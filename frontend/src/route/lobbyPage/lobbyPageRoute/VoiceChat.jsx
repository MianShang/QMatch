import React, { useEffect, useRef, useState, useImperativeHandle, useCallback, useContext } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import './VoiceChat.css';
import { LogContext } from '../../../App';
import { useSpeakingIndicator } from "../../../hooks/voiceChat/useSpeakingIndicator";

const VoiceChat = React.forwardRef(
  (
    {
      channelId,
      uid,
      onSpeakers,
      onLocalMuteChange,
      onJoinChange,
      onParticipantsChange,
      roomId,
      globalStomp,
      onVoiceChatSwitch,
    },
    ref
  ) => {

    // Agora 관련 참조들
    const clientRef = useRef(null);
    const localAudioTrackRef = useRef(null);
    const joiningRef = useRef(false);

    // 음성 상태
    const [joined, setJoined] = useState(false);
    const [muted, setMuted] = useState(false);
    const [joinedUserIds, setJoinedUserIds] = useState([]);

    // 전역 음성 설정 불러오기
    const { voiceSettings } = useContext(LogContext);

    // STOMP 통신용 (참여자 알림)
    const notifyVoiceParticipantChange = (action, voiceChannelId, customRoomId) => {
      const targetRoomId = customRoomId || roomId;
      if (!targetRoomId || !uid || !globalStomp) return;
      try {
        const destination =
          action === "join"
            ? `/app/voice/${targetRoomId}/join`
            : `/app/voice/${targetRoomId}/leave`;

        const payload = { userId: uid, voiceChannelId, roomId: targetRoomId };
        console.log("🔈 STOMP SEND:", destination, payload);

        globalStomp.publish(destination, payload);
      } catch (error) {
        console.error(`음성채팅 ${action} 알림 실패:`, error);
      }
    };

    // 스피킹 감지
    const speakers = useSpeakingIndicator(clientRef.current);

    useEffect(() => {
      if (onSpeakers) onSpeakers(speakers);
    }, [speakers, onSpeakers]);

    // 부모에서 제어할 수 있게 공개
    useImperativeHandle(ref, () => ({
      leaveChannel,
      joinChannel,
      toggleMute,
      localAudioTrackRef,
    }));

    // Agora 채널 입장 처리
    const joinChannel = async (channelId) => {
      if (joiningRef.current || joined || clientRef.current) return;
      joiningRef.current = true;
      setJoinedUserIds([]);

      try {
        const channelIdStr = String(channelId || "");

        // 채널 이름 정규화
        let channelName;
        if (channelIdStr.startsWith("friend_")) {
          const ids = channelIdStr.replace("friend_", "").split("_").sort();
          channelName = `friend_voice_${ids.join("_")}`.replace(/[^a-zA-Z0-9_]/g, "_");
        } else {
          channelName = `voice_channel_${roomId}_${channelIdStr}`.replace(/[^a-zA-Z0-9_]/g, "_");
        }
        channelName = channelName.substring(0, 64) || "voice_channel_default";

        // 백엔드 토큰 요청
        const { data } = await axios.post("/agora/token", { channelName, uid });
        const token = data.token;

        // Agora 클라이언트 생성
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        // 사용자 이벤트 처리
        client.on("user-joined", (user) => {
          setJoinedUserIds((prev) =>
            prev.includes(user.uid) ? prev : [...prev, user.uid]
          );
        });
        client.on("user-left", (user) => {
          setJoinedUserIds((prev) => prev.filter((id) => id !== user.uid));
        });
        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "audio") {
            const audioEl = user.audioTrack?.play();

            // 스피커 장치 적용 (setSinkId 지원 시)
            try {
              if (audioEl && typeof audioEl.setSinkId === "function" && voiceSettings.outputDeviceId) {
                await audioEl.setSinkId(voiceSettings.outputDeviceId);
                console.log(`🎧 스피커 장치 적용됨: ${voiceSettings.outputDeviceId}`);
              }
            } catch (err) {
              console.warn("⚠️ 스피커 장치 적용 실패:", err);
            }
          }
        });

        // Agora 채널 입장
        await client.join(import.meta.env.VITE_AGORA_APP_ID, channelName, token, uid);
        client.enableAudioVolumeIndicator();

        // 마이크 트랙 생성
        const localTrack = await AgoraRTC.createMicrophoneAudioTrack();

        // 마이크 장치 및 볼륨 적용
        if (voiceSettings.inputDeviceId) {
          await localTrack.setDevice(voiceSettings.inputDeviceId);
          console.log(`🎤 마이크 장치 적용됨: ${voiceSettings.inputDeviceId}`);
        }
        localTrack.setVolume(voiceSettings.micVolume);
        console.log(`🎚️ 마이크 볼륨 설정됨: ${voiceSettings.micVolume}`);

        // Agora에 트랙 게시
        localAudioTrackRef.current = localTrack;
        await client.publish([localTrack]);

        // 상태 갱신
        setJoined(true);
        setMuted(false);
        onLocalMuteChange?.(false);
        onJoinChange?.(true);

        // 서버에 참여자 입장 알림
        notifyVoiceParticipantChange("join", channelIdStr);

        // 전역 전환 상태
        onVoiceChatSwitch?.({
          type: "join",
          channelId: channelIdStr,
          roomId,
        });

      } catch (e) {
        console.error("음성채널 입장 실패:", e);
      } finally {
        joiningRef.current = false;
      }
    };

    // 채널 퇴장 처리
    async function leaveChannel(forceRoomId = roomId) {
      try {
        const channelIdStr = String(channelId || "");

        if (clientRef.current && localAudioTrackRef.current) {
          await clientRef.current.unpublish([localAudioTrackRef.current]);
        }

        if (localAudioTrackRef.current) {
          localAudioTrackRef.current.stop();
          localAudioTrackRef.current.close();
          localAudioTrackRef.current = null;
        }

        if (clientRef.current) {
          await clientRef.current.leave();
          clientRef.current.removeAllListeners();
          clientRef.current = null;
        }

        onLocalMuteChange?.(false);
        onSpeakers?.({});
        onJoinChange?.(false);

        notifyVoiceParticipantChange("leave", channelIdStr, forceRoomId);

        onVoiceChatSwitch?.({
          type: "leave",
          channelId: channelIdStr,
          roomId: forceRoomId,
        });

        setJoinedUserIds([]);
      } catch (error) {
        console.error("음성채팅 퇴장 중 오류:", error);
      } finally {
        setMuted(false);
        setJoined(false);
      }
    }

    // 음소거 토글
    const toggleMute = async () => {
      if (!localAudioTrackRef.current) return;
      const next = !muted;
      await localAudioTrackRef.current.setEnabled(!next);
      setMuted(next);
      onLocalMuteChange?.(next);
    };

    return null;
  }
);

export default VoiceChat;
