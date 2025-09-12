import { useContext, useEffect, useState } from "react";
import axios from "axios";

export function useFriendsinventory(userId, bottomToggle) {
    const [responseUsers, setResponseUsers] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // bottomToggle이 'friends'나 'blocked'일 때만 API 호출
        if (bottomToggle) {
            setLoading(true); // 로딩 시작
            setError(null); // 에러 초기화

            const fetchFriends = async () => {
                try {
                    const response = await axios.get('/api/friends/inventory',{ 
                        params:{ 
                            userId: userId,
                            bottomToggle: bottomToggle
                         }
                });
                    setResponseUsers(response.data);
                } catch (e) {
                    setError(e.response?.data?.message || '알 수 없는 오류가 발생했습니다.'); 
                    setResponseUsers([]);
                } finally {
                    setLoading(false); // 로딩 종료
                }
            };
            fetchFriends();
        } else {
            setResponseUsers([]);
        }
    }, [userId, bottomToggle]);

    return { responseUsers, error, loading };
}