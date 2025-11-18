import React, { useEffect } from 'react';
import './FriendDeleteModal.css';

function FriendDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  friendName 
}) {
  // 모달이 열려있을 때 배경 스크롤 및 상호작용 차단
  useEffect(() => {
    if (isOpen) {
      // 스크롤 방지
      document.body.style.overflow = 'hidden';
      
      // ESC 키로 모달 닫기
      const handleEscKey = (event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscKey);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="friend-delete-modal-overlay" onClick={onClose}>
      <div className="friend-delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="friend-delete-modal-header">
          <h3>친구 삭제</h3>
        </div>
        
        <div className="friend-delete-modal-body">
          <p>
            <strong>{friendName}</strong>님을 친구 목록에서 삭제하시겠습니까?
          </p>
          <p className="warning-text">
            삭제된 친구는 다시 친구 요청을 보내야 합니다.
          </p>
        </div>
        <div className="friend-delete-modal-footer">
            <button 
            className="friend-delete-confirm-btn"
            onClick={onConfirm}
          >
            삭제
          </button>
          <button 
            className="friend-delete-cancel-btn"
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default FriendDeleteModal;
