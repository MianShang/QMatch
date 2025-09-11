import { useContext } from 'react';
import './list.css';
import { LogContext } from '../../../App.jsx';

function FriendListPage() {
  const { friends, statusByUser } = useContext(LogContext);

  const friendsWithStatus = friends.map(friend => ({ ...friend, status: statusByUser[friend.userId] || friend.status }));

  return (
    <div className='listRouteSize contentStyle'>
      <div className="chatListScrollWrapper chatListScroll">
        {friendsWithStatus.length > 0 ? (
          friendsWithStatus.map(friend => (
            <div key={friend.userId} className="chatCard">
              <div className="chatCardHeader">
                {/* 친구 프로필 이미지 또는 아이콘 */}
                <img src={friend.userProfile || "https://placehold.co/45"} alt="프로필 이미지" className="chatCardImage" />
                {/* 친구 이름 */}
                <span className="chatCardTitle">{friend.userName}</span>
                <p>{friend.status}</p>

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