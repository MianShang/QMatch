import { useState, useEffect, useRef, useContext } from 'react';
import './list.css';
import './friendListPage.css';
import { LogContext } from '../../../App.jsx';
import { FriendInventory } from './friendInventory.jsx';
import { FaXmark } from "react-icons/fa6";
import { useFriendDelete } from '../../../hooks/friends/useFriendDelete.js';
import { useNavigate } from "react-router-dom";
import FriendDeleteModal from '../../../modal/FriendDeleteModal/FriendDeleteModal.jsx';

function FriendListPage() {
  const { friends, statusByUser, userData, friendUnreadCounts, setFriendUnreadCounts, isRunning } = useContext(LogContext);
  const [bottomToggle, setBottomToggle] = useState(null);
  const [selected, setSelected] = useState(null);
  const containerRef = useRef(null);
  const { deleteFriend } = useFriendDelete();
  const navigate = useNavigate();
  
  // 친구 삭제 모달 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState(null);

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

  // 친구 삭제 모달 열기
  const handleDeleteClick = (friend) => {
    setFriendToDelete(friend);
    setIsDeleteModalOpen(true);
  };

  // 친구 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!friendToDelete) return;
    
    try {
      const result = await deleteFriend(friendToDelete.userId, userData.userId);
      if (result.success) {
        // 성공 시 모달 닫기
        setIsDeleteModalOpen(false);
        setFriendToDelete(null);
        // 여기서 친구 목록 새로고침이나 상태 업데이트를 할 수 있습니다
      } else {
        console.error('친구 삭제 실패:', result.message);
      }
    } catch (error) {
      console.error('친구 삭제 중 오류 발생:', error);
    }
  };

  // 친구 삭제 모달 닫기
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setFriendToDelete(null);
  };

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
    <>
      <div className='listRouteSize contentStyle' ref={containerRef} style={{ position: 'relative' }}>
        {/* bottomToggle이 활성화되면 FriendInventory를 렌더링 */}
        {bottomToggle && <FriendInventory bottomToggle={bottomToggle} userId={userData.userId} />}
        {/* 친구 목록과 인벤토리를 감싸는 div */}
        <div className="chatListScrollWrapper chatListScroll">
          {/* 친구 목록 렌더링 */}
          {friendsWithStatus.length > 0 ? (
            friendsWithStatus.map(friend => (
              <div
                key={friend.userId}
                className={selected === friend.userId ? 'selectCardStyle' : 'chatCard'}
                onClick={() => {
                  setSelected(friend.userId);

                  if (friendUnreadCounts[friend.userId] > 0) {
                    // 전역 context 업데이트
                    setFriendUnreadCounts(prev => ({
                      ...prev,
                      [friend.userId]: 0
                    }));
                  }

                  navigate("/lobby", {
                    state: {
                      type: "friend",
                      friendId: friend.userId,
                      friendName: friend.userName,
                    },
                  });
                }}
              >
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
                  <span className="chatCardTitle ellipsis">{friend.userName}</span>
                  {/* 안읽은 메시지 카운트 */}
                  {friendUnreadCounts[friend.userId] > 0 && (
                    <span className="unread-badge">
                      {friendUnreadCounts[friend.userId]}
                    </span>
                  )}
                  <FaXmark
                    size={25}
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation(); // 친구 선택 이벤트 방지
                      handleDeleteClick(friend);
                    }}
                    className='CheckBox'
                  />
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
            onClick={() => setBottomToggle(bottomToggle === 'friends' ? null : 'friends')}
            className={`bottomToggleSwitch ${bottomToggle === 'friends' ? 'bottomActiveBorder' : 'bottomContentStyle'}`} >
            친구 요청
          </div>

          {/* 차단 목록 버튼 */}
          <div
            onClick={() => setBottomToggle(bottomToggle === 'blocked' ? null : 'blocked')}
            className={`bottomToggleSwitch ${bottomToggle === 'blocked' ? 'bottomActiveBorder' : 'bottomContentStyle'} `}
          >
            차단 목록
          </div>
        </div>
      </div>

      {/* 친구 삭제 확인 모달 - 최상위 레벨로 이동 */}
      <FriendDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        friendName={friendToDelete?.userName || ''}
      />
    </>
  );
}

export default FriendListPage;