import axios from '@axios';
import { useContext } from "react";
import { LogContext } from '../../App';

export function useLogout(){
  const {
    setIsLogIn,
    setUserData,
    voiceChatRef,
    setJoinedVoice,
    setFriendVoiceChatActive,
    setCurrentFriendVoiceChat,
    setCurrentGroupVoiceChat,
    setVoiceChatRoomId,
    setCurrentVoiceRoomId,
    globalStomp, // ✅ 전역 STOMP 클라이언트 추가
  } = useContext(LogContext);

  // 로그아웃 처리 API
  async function logoutFunc() {

    try {
      // ✅ STOMP 세션 종료 (로그아웃 시 PresenceEvent 오프라인 반영)
      if (globalStomp && globalStomp.isConnected()) {
        try {
          await globalStomp.deactivate();
          console.log("STOMP 세션이 정상적으로 종료되었습니다.");
        } catch (e) {
          console.warn("STOMP 세션 종료 중 오류:", e);
        }
      }

      // 백엔드 로그아웃 요청
      await axios.post("/api/logout");

      // 음성채팅 종료
      if (voiceChatRef?.current) {
        try {
          await voiceChatRef.current.leaveChannel();
          console.log("Agora 채널에서 정상적으로 퇴장했습니다.");
        } catch (err) {
          console.warn("음성채널 퇴장 중 오류:", err);
        }
      }

      // 음성 상태 초기화
      setJoinedVoice(false);
      setFriendVoiceChatActive(false);
      setCurrentFriendVoiceChat(null);
      setCurrentGroupVoiceChat(null);
      setVoiceChatRoomId(null);
      setCurrentVoiceRoomId(null);

      // 로그인 상태 초기화
      setIsLogIn(false);
      setUserData(null);

    } catch (error) {
      console.error("로그아웃 중 오류:", error);
    }
  }

  return logoutFunc;
}
