import React, { useState, useEffect, useRef } from 'react';
import './MessageContextMenu.css';

const MessageContextMenu = ({ 
    isVisible, 
    position, 
    onClose, 
    messageId, 
    roomId, 
    isPinned, 
    onTogglePin,
    onDeleteMessage,
    messageContent,
    messageData,
    isFriendChat = false,
    currentUserId
}) => {
    const menuRef = useRef(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isVisible, onClose]);

    const handleDeleteMessage = () => {
        onDeleteMessage(messageId, roomId, isFriendChat, messageData);
    };

    const handleCopyMessage = async () => {
        
        if (!messageContent || messageContent.trim() === '') {
            return;
        }

        try {
            await navigator.clipboard.writeText(messageContent);
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
            // 폴백 방법
            try {
                const textArea = document.createElement('textarea');
                textArea.value = messageContent;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                    console.log('폴백 복사 성공');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2000);
                } else {
                    console.error('폴백 복사도 실패');
                }
            } catch (fallbackErr) {
                console.error('폴백 복사 오류:', fallbackErr);
            }
        }
        onClose();
    };

    if (!isVisible) return null;

    return (
        <>
            <div 
                ref={menuRef}
                className="message-context-menu"
                style={{
                    position: 'fixed',
                    left: position.x - 160, // 메뉴 너비만큼 왼쪽으로 이동
                    top: position.y,
                    zIndex: 1000
                }}
            >
                <div className="context-menu-item" onClick={handleCopyMessage}>
                    <div className="context-menu-icon">
                        📋
                    </div>
                    <span>복사하기</span>
                </div>
                <div className="context-menu-item" onClick={() => {
                    onTogglePin(messageId, roomId, isFriendChat, messageData);
                    onClose();
                }}>
                    <div className="context-menu-icon">
                        {isPinned ? '📌' : '📌'}
                    </div>
                    <span>{isPinned ? '고정 해제' : '상단 고정'}</span>
                </div>
                {/* 본인 메시지에만 삭제 옵션 표시 */}
                {messageData && (
                    (messageData.name === currentUserId || messageData.senderId === currentUserId)
                ) && (
                    <div className="context-menu-item" onClick={() => {
                        onDeleteMessage(messageId, roomId, isFriendChat, messageData);
                        onClose();
                    }}>
                        <div className="context-menu-icon">
                            🗑️
                        </div>
                        <span>삭제하기</span>
                    </div>
                )}
            </div>
        </>
    );
};

export default MessageContextMenu;
