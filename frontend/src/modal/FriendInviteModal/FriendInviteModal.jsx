import React, { useEffect, useContext } from 'react';
import './FriendInviteModal.css';
import { LogContext } from '../../App.jsx';
import { useFriendInvite } from '../../hooks/friends/useFriendInvite.js';

function FriendInviteModal({ 
  open, 
  onClose, 
  room, 
  onInviteSent 
}) {
  const { friends, statusByUser, userData } = useContext(LogContext);
  const {
    availableFriends,
    setAvailableFriends,
    inviting,
    roomMembers,
    loading,
    fetchRoomMembers,
    inviteFriend,
    getStatusIcon,
    getStatusClass
  } = useFriendInvite(room);

  // 방 참여자 목록 가져오기
  useEffect(() => {
    if (open && room) {
      fetchRoomMembers();
    }
  }, [open, room, fetchRoomMembers]);

  // 친구 목록 필터링 (온라인이고 현재 방에 없는 친구들만)
  useEffect(() => {
    if (!open || !friends || !room) return;

    const filtered = friends.filter(friend => {
      const status = statusByUser[friend.userId] || friend.status || '오프라인';
      const isOnline = status === '온라인' || status === '자리비움';
      const isNotInRoom = !roomMembers.includes(friend.userId);
      
      return isOnline && isNotInRoom;
    });

    setAvailableFriends(filtered);
  }, [open, friends, statusByUser, room, roomMembers, setAvailableFriends]);

  // 친구 초대 핸들러
  const handleInviteFriend = async (friend) => {
    const result = await inviteFriend(friend, userData);
    
    if (result.success && onInviteSent) {
      onInviteSent(friend);
    }
  };

  if (!open) return null;

  return (
    <div className="friend-invite-modal">
      <div className="friend-invite-header">
        <h3 className="friend-invite-title">친구 초대</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      
      <div className="friend-invite-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>친구 목록을 불러오는 중...</p>
          </div>
        ) : availableFriends.length > 0 ? (
          <div className="friend-list">
            {availableFriends.map(friend => {
              const status = statusByUser[friend.userId] || friend.status || '오프라인';
              const isInviting = inviting[friend.userId];
              
              return (
                <FriendItem
                  key={friend.userId}
                  friend={friend}
                  status={status}
                  isInviting={isInviting}
                  onInvite={handleInviteFriend}
                  getStatusIcon={getStatusIcon}
                  getStatusClass={getStatusClass}
                />
              );
            })}
          </div>
        ) : (
          <EmptyFriendsMessage />
        )}
      </div>
    </div>
  );
}

// 친구 아이템 컴포넌트
function FriendItem({ friend, status, isInviting, onInvite, getStatusIcon, getStatusClass }) {
  const handleInvite = () => {
    onInvite(friend);
  };

  // 프로필 이미지가 없으면 이름의 첫 글자로 아바타 생성
  const getFriendAvatar = (friend) => {
    if (friend.profileImage) {
      return (
        <img 
          src={friend.profileImage} 
          alt={friend.userName}
          className="friend-avatar"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    return null;
  };

  const getInitialAvatar = (friend) => {
    const initial = friend.userName ? friend.userName.charAt(0).toUpperCase() : 'U';
    return (
      <div className="friend-avatar-initial" style={{ display: friend.profileImage ? 'none' : 'flex' }}>
        {initial}
      </div>
    );
  };

  return (
    <div className="friend-item">
      <div className="friend-avatar-container">
        {getFriendAvatar(friend)}
        {getInitialAvatar(friend)}
      </div>
      <div className="friend-info">
        <p className="friend-name">{friend.userName}</p>
        <p className={`friend-status ${getStatusClass(status)}`}>
          {getStatusIcon(status)} {status}
        </p>
      </div>
      <button
        className="invite-btn"
        onClick={handleInvite}
        disabled={isInviting}
      >
        {isInviting ? '초대 중...' : '초대'}
      </button>
    </div>
  );
}

// 빈 친구 목록 메시지 컴포넌트
function EmptyFriendsMessage() {
  return (
    <div className="empty-friends">
      <div className="empty-friends-icon">👥</div>
      <p className="empty-friends-text">
        초대할 수 있는 온라인 친구가 없습니다.
      </p>
    </div>
  );
}

export default FriendInviteModal;
