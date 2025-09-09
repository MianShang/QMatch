import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import axios from 'axios';
import './list.css';

function FriendListPage({userId}) {
  
  const [friends,setFriends] = useState([]);

  useEffect(() => {
    if (!userId) return; // userId가 없으면 API 호출을 건너뜁니다.

    const fetchFriends = async () => {
      try {
        const response = await axios.get(`/api/friends/list?userId=${userId}`);
        setFriends(response.data);
      } catch (error) {
        console.error("친구 목록 불러오기 실패:", error);
      }
    };

    fetchFriends();
  }, [userId]);

  return (
    <div className='listRouteSize contentStyle'>
      <div className="chatListScrollWrapper chatListScroll">
        {friends.length > 0 ? (
          friends.map(friend => (
            // chatCard 클래스를 활용해 친구 목록 카드 디자인
            <div key={friend.id} className="chatCard">
              <div className="chatCardHeader">
                {/* 친구 프로필 이미지 또는 아이콘 */}
                <img 
                  src={friend.profileImage || "https://placehold.co/45"} 
                  alt="프로필 이미지" 
                  className="chatCardImage"
                />
                
                {/* 친구 이름 */}
                <span className="chatCardTitle">{friend.userId}</span>

                {/* 여기에 친구 삭제 또는 더보기 버튼 추가 가능 */}
                <button className="chatCardDelete">🗑</button>
              </div>
            </div>
          ))
        ) : (
          <div className="chatCard">
            <span className="chatCardTitle">아직 친구가 없습니다</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default FriendListPage
