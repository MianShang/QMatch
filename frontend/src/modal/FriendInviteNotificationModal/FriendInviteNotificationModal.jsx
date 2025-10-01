import React from 'react';
import './FriendInviteNotificationModal.css';
import { useFriendInviteNotification } from '../../hooks/friends/useFriendInviteNotification.js';

function FriendInviteNotificationModal({ 
  open, 
  onClose, 
  inviteData,
  onAccept 
}) {
  const {
    processing,
    acceptInvite,
    rejectInvite,
    getRoomAvatar
  } = useFriendInviteNotification();

  // 초대 수락 핸들러
  const handleAccept = () => {
    acceptInvite(inviteData, onAccept, onClose);
  };

  // 초대 거절 핸들러
  const handleReject = () => {
    rejectInvite(inviteData, onClose);
  };

  if (!open || !inviteData) return null;

  return (
    <div className="friend-invite-notification">
      <div className="notification-header">
        <div className="notification-icon">🎮</div>
        <h3 className="notification-title">친구 초대</h3>
      </div>
      
      <div className="notification-content">
        <RoomInfo 
          roomName={inviteData.roomName} 
          inviterName={inviteData.inviterName}
          inviterProfileImage={inviteData.inviterProfileImage}
          getRoomAvatar={getRoomAvatar}
        />
        
        <NotificationActions
          processing={processing}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      </div>
    </div>
  );
}

// 방 정보 컴포넌트
function RoomInfo({ roomName, inviterName, inviterProfileImage, getRoomAvatar }) {
  // 초대자 아바타 생성 함수
  const getInviterAvatar = () => {
    if (inviterProfileImage) {
      return (
        <img 
          src={inviterProfileImage} 
          alt={inviterName}
          className="inviter-avatar"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    return null;
  };

  const getInviterInitialAvatar = () => {
    const initial = inviterName ? inviterName.charAt(0).toUpperCase() : 'U';
    return (
      <div 
        className="inviter-avatar-initial" 
        style={{ display: inviterProfileImage ? 'none' : 'flex' }}
      >
        {initial}
      </div>
    );
  };

  return (
    <div className="room-info">
      <div className="room-avatar">
        {getRoomAvatar(roomName)}
      </div>
      <div className="room-details">
        <p className="room-name">{roomName}</p>
        <div className="inviter-info">
          <div className="inviter-avatar-container">
            {getInviterAvatar()}
            {getInviterInitialAvatar()}
          </div>
          <p className="inviter-text">
            {inviterName}님이 초대했습니다
          </p>
        </div>
      </div>
    </div>
  );
}

// 알림 액션 버튼 컴포넌트
function NotificationActions({ processing, onAccept, onReject }) {
  return (
    <div className="notification-actions">
      <button
        className="action-btn accept-btn"
        onClick={onAccept}
        disabled={processing}
      >
        {processing ? '처리 중...' : '수락'}
      </button>
      <button
        className="action-btn reject-btn"
        onClick={onReject}
        disabled={processing}
      >
        거절
      </button>
    </div>
  );
}

export default FriendInviteNotificationModal;
