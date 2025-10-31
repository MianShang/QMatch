import { useEffect } from "react";

/**
 * 음성채널 삭제 이벤트를 STOMP로 수신하고
 * 자동 퇴장 및 UI 갱신을 수행하는 훅
 */
export function useVoiceChannelSubscriber(
  globalStomp,             // { subscribe, publish, isConnected }
  joinedVoice,
  voiceChatRoomId,
  handleLeaveVoice,
  setVoiceChannels,
  fetchVoiceChannels,
  setVoiceParticipants
) {
  useEffect(() => {
    // isConnected가 함수라면 실제 연결 상태 호출
    const connected = typeof globalStomp?.isConnected === "function"
      ? globalStomp.isConnected()
      : globalStomp?.isConnected;

    console.log("useVoiceChannelSubscriber 실행됨, STOMP 연결상태:", connected);

    if (!connected) {
      console.warn("STOMP 아직 연결 안 됨 — 1초 후 재시도");
      // 연결될 때까지 주기적으로 재시도
      const timer = setTimeout(() => {
        if (typeof globalStomp?.isConnected === "function" && globalStomp.isConnected()) {
          console.log("STOMP 연결됨 — 재구독 시도");
          // 다시 훅 실행 (useEffect는 globalStomp 의존성 덕분에 자동 재실행됨)
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    console.log("STOMP 구독 시작: /topic/voice/channel-deleted");
    const subscription = globalStomp.subscribe(
      "/topic/voice/channel-deleted",
      (msg) => {
        try {
          const data = JSON.parse(msg.body);
          console.log("채널 삭제 이벤트 수신:", data);

          // 참여 중인 채널이 삭제된 경우 자동 퇴장
          if (joinedVoice && voiceChatRoomId === data.voiceChannelId) {
            console.log("참여 중인 채널이 삭제되어 자동 퇴장 처리");
            handleLeaveVoice();
          }

          // 참여자 목록에서 해당 채널 제거
          setVoiceParticipants((prev) => {
            const updated = { ...prev };
            delete updated[data.voiceChannelId];
            return updated;
          });

          // UI 목록에서 해당 채널 제거
          if (typeof setVoiceChannels === "function") {
            setVoiceChannels((prev) =>
              prev.filter((ch) => ch.id !== data.voiceChannelId)
            );
          }

          // 서버 상태 새로고침
          fetchVoiceChannels && fetchVoiceChannels(data.chatRoomId);
        } catch (error) {
          console.error("채널 삭제 이벤트 처리 오류:", error);
        }
      }
    );

    return () => {
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
        console.log("STOMP 구독 해제 완료: /topic/voice/channel-deleted");
      }
    };
  }, [
    globalStomp,
    joinedVoice,
    voiceChatRoomId,
    handleLeaveVoice,
    setVoiceChannels,
    fetchVoiceChannels,
    setVoiceParticipants,
  ]);
}
