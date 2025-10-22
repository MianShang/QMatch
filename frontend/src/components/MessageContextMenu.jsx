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
    isFriendChat = false 
}) => {
    const menuRef = useRef(null);

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

    const handlePinToggle = () => {
        onTogglePin(messageId, roomId, isFriendChat);
        onClose();
    };

    if (!isVisible) return null;

    return (
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
            <div className="context-menu-item" onClick={handlePinToggle}>
                <div className="context-menu-icon">
                    {isPinned ? '📌' : '📌'}
                </div>
                <span>{isPinned ? '고정 해제' : '상단 고정'}</span>
            </div>
        </div>
    );
};

export default MessageContextMenu;
