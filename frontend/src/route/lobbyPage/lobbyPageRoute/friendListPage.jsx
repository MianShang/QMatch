import { useState, useEffect, useRef, useContext } from 'react';
import './list.css';
import './friendListPage.css';
import { LogContext } from '../../../App.jsx';
import { FriendInventory } from './friendInventory.jsx';
import { FaXmark } from "react-icons/fa6";
import { useFriendDelete } from '../../../hooks/friends/useFriendDelete.js';
import { useNavigate } from "react-router-dom";
import FriendDeleteModal from '../../../modal/FriendDeleteModal/FriendDeleteModal.jsx';
import axios from '@axios';

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
  
  // 친구 닉네임 매핑 (userId -> userNickname)
  const [friendNicknames, setFriendNicknames] = useState({});

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

  // userNickname이 null인 친구들의 닉네임을 프로필 API로 가져오기
  useEffect(() => {
    if (!friends || friends.length === 0) return;

    const fetchMissingNicknames = async () => {
      // userNickname이 null이거나 빈 문자열인 친구들만 필터링
      const friendsNeedingNickname = friends.filter(f => 
        (!f.userNickname || f.userNickname.trim() === '') && 
        (!f.userNickName || f.userNickName.trim() === '') &&
        !friendNicknames[f.userId] // 이미 가져온 경우 제외
      );

      if (friendsNeedingNickname.length === 0) return;

      // 각 친구의 프로필 정보를 병렬로 가져오기
      const nicknamePromises = friendsNeedingNickname.map(async (friend) => {
        try {
          const response = await axios.get("/api/profile/user/info", {
            params: { userId: friend.userId }
          });
          return {
            userId: friend.userId,
            nickname: response.data.userNickname || response.data.userNickName || null
          };
        } catch (error) {
          console.error(`친구 ${friend.userId} 닉네임 가져오기 실패:`, error);
          return {
            userId: friend.userId,
            nickname: null
          };
        }
      });

      const results = await Promise.all(nicknamePromises);
      const nicknameMap = {};
      results.forEach(result => {
        if (result && result.nickname) {
          nicknameMap[result.userId] = result.nickname;
        }
      });

      if (Object.keys(nicknameMap).length > 0) {
        setFriendNicknames(prev => ({ ...prev, ...nicknameMap }));
      }
    };

    fetchMissingNicknames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends]);

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

  // 친구 표시 이름 가져오는 헬퍼 함수
  const getFriendDisplayName = (friend) => {
    // friendNicknames 상태에서 먼저 확인 (프로필 API로 가져온 닉네임)
    if (friendNicknames[friend.userId]) {
      return friendNicknames[friend.userId];
    }
    // userNickname (소문자 n) 우선 확인
    if (friend.userNickname && friend.userNickname.trim() !== '') {
      return friend.userNickname.trim();
    }
    // userNickName (대문자 N) 확인
    if (friend.userNickName && friend.userNickName.trim() !== '') {
      return friend.userNickName.trim();
    }
    // 둘 다 없으면 userName 사용
    return friend.userName || '알 수 없음';
  };

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
                      friendName: getFriendDisplayName(friend),
                    },
                  });
                }}
              >
                <div className="chatCardHeader">
                  <div className="profile-image-container">
                    <img
                      src={friend?.userProfile ? import.meta.env?.VITE_API_URL + friend?.userProfile : "https://placehold.co/45"}
                      alt="프로필 이미지"
                      className="chatCardImage"
                    />
                    <div
                      className={`status-icon ${friend.statusInfo.className}`}
                      title={friend.statusInfo.title}
                    />
                  </div>
                  <span className="chatCardTitle ellipsis">{getFriendDisplayName(friend)}</span>
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
        friendName={friendToDelete ? getFriendDisplayName(friendToDelete) : ''}
      />
    </>
  );
}

export default FriendListPage;