import React, { useEffect, useState } from 'react';
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

  const [timeLeft, setTimeLeft] = useState(30);
  const [isAutoRejected, setIsAutoRejected] = useState(false);

  // 30초 타이머 및 자동 거절 로직
  useEffect(() => {
    if (!open || !inviteData || isAutoRejected) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // 시간이 끝나면 자동으로 거절
          setIsAutoRejected(true);
          handleAutoReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, inviteData, isAutoRejected]);

  // 모달이 열릴 때마다 타이머 리셋
  useEffect(() => {
    if (open && inviteData) {
      setTimeLeft(30);
      setIsAutoRejected(false);
    }
  }, [open, inviteData]);

  // 자동 거절 핸들러
  const handleAutoReject = () => {
    rejectInvite(inviteData, onClose, true); // 자동 거절 플래그 전달
  };

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
        <div className="timer-display">
          {timeLeft}초 후 자동 거절
        </div>
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
