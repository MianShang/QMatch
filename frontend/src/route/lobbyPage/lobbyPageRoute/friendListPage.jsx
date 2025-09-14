import { useState, useEffect, useRef, useContext } from 'react';
import './list.css';
import './friendListPage.css';
import { LogContext } from '../../../App.jsx';
import { FriendInventory } from './friendInventory.jsx';

function FriendListPage() {
  const { friends, statusByUser, userData } = useContext(LogContext);
  const [bottomToggle, setBottomToggle] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // 외부 클릭 감지 함수
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        // 클릭된 곳이 containerRef 바깥이라면, 상태를 null로 초기화하여 비활성화
        setBottomToggle(null);
      }
    }

    // 문서에 이벤트 리스너 추가
    document.addEventListener("mousedown", handleClickOutside);

    // 컴포넌트가 사라질 때 이벤트 리스너 정리
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  // 친구 목록에 실시간 상태 정보를 결합, CSS 클래스와 title을 미리 계산
  const friendsWithStatus = friends.map(friend => {
    const status = statusByUser[friend.userId] || friend.status || '오프라인';
    const statusInfo = ((s) => {
      if (s === '온라인') return { className: 'online', title: '온라인' };
      if (s === '자리비움') return { className: 'away', title: '자리비움' };
      return { className: 'offline', title: '오프라인' };
    })(status);
    return { ...friend, statusInfo };
  });

  return (
    <div className='listRouteSize contentStyle' ref={containerRef}  style={{ position: 'relative' }}>
    {/* bottomToggle이 활성화되면 FriendInventory를 렌더링 */}
    {bottomToggle && <FriendInventory bottomToggle={bottomToggle} userId={userData.userId} />}
      {/* 친구 목록과 인벤토리를 감싸는 div */}
      <div className="chatListScrollWrapper chatListScroll">
        {/* 친구 목록 렌더링 */}
        {friendsWithStatus.length > 0 ? (
          friendsWithStatus.map(friend => (
            <div key={friend.userId} className="chatCard">
              <div className="chatCardHeader">
                <div className="profile-image-container">
                  <img
                    src={friend.userProfile || "https://placehold.co/45"}
                    alt="프로필 이미지"
                    className="chatCardImage"
                  />
                  <div
                    className={`status-icon ${friend.statusInfo.className}`}
                    title={friend.statusInfo.title}
                  />
                </div>
                <span className="chatCardTitle">{friend.userName}</span>
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

      {/* 하단 버튼 영역 (친구 목록과 별개로 렌더링) */}
      <div style={{ display: "flex", position: 'relative' }}>
        {/* 친구 요청 버튼 */}
        <div
          onClick={() => setBottomToggle('friends')}
          className={`bottomToggleSwitch ${bottomToggle === 'friends' ? 'bottomActiveBorder' : 'bottomContentStyle'}`} >
          친구 요청
        </div>

        {/* 차단 목록 버튼 */}
        <div
          onClick={() => setBottomToggle('blocked')}
          className={`bottomToggleSwitch ${bottomToggle === 'blocked' ? 'bottomActiveBorder' : 'bottomContentStyle'} `}
          style={{ marginLeft: "10px" }}
        >
          차단 목록
        </div>
      </div>
    </div>
  );
}

export default FriendListPage;