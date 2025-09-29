import axios from "axios";

export function useFriendDelete() {
  // 친구 삭제 함수 반환
  const deleteFriend = async (requesterId, addresseeId) => {
    try {
      const response = await axios.post("/api/friends/delete", null, {
        params: { requesterId, addresseeId },
      });
      return (
        { success: true, message: response.data }
      ) // 서버 응답 반환
    } catch (error) {
      return { success: false, message: response.data }
    }
  };

  return { deleteFriend };
}