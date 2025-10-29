import React, { useState } from "react";
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './CreateVoiceChannelModal.css';

function CreateVoiceChannelModal({ setShowCreateVoiceChannelModal, chatRoomId, onVoiceChannelCreated, roomMaxUsers }) {
    const [channelName, setChannelName] = useState('');
    const [maxUsers, setMaxUsers] = useState('unlimited');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [isCreating, setIsCreating] = useState(false);  // 방 생성 중 상태

    // 드롭다운 옵션 생성: 인원 제한 없음 ~ 방 최대인원-1
    const maxUserOptions = [
        { value: 'unlimited', label: '인원 제한 없음' },
        ...Array.from({ length: roomMaxUsers - 2 }, (_, i) => ({
            value: (i + 2).toString(),
            label: `${i + 2}명`
        }))
    ];

    const handleClose = () => {
        setShowCreateVoiceChannelModal(false);
    };

    const handleOverlayClick = () => handleClose();
    const handleContentClick = (e) => e.stopPropagation();

    const toggleDropdown = (e) => {
        if (!isDropdownOpen) {
            const rect = e.currentTarget.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    const createVoiceChannel = async () => {
        // 이미 생성 중이면 중복 요청 방지
        if (isCreating) {
            return;
        }
        
        // 유효성 검사
        if (!channelName || channelName.trim() === '') {
            toast.error('음성 채널 이름을 입력해주세요.');
            return;
        }

        if (!chatRoomId) {
            toast.error('채팅방 정보가 없습니다.');
            return;
        }

        // 생성 시작 - 로딩 상태 활성화
        setIsCreating(true);

        try {
            const requestData = {
                chatRoomId: chatRoomId,
                voiceChannelName: channelName.trim(),
                maxUsers: maxUsers === 'unlimited' ? null : parseInt(maxUsers)
            };

            const res = await axios.post('/api/voice/channels', requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (res.status === 200 || res.status === 201) {
                onVoiceChannelCreated(res.data);
                handleClose();
                toast.success('음성 채널 생성 성공');
            } else {
                throw new Error('음성 채널 생성 실패');
            }
        } catch (error) {
            console.error('음성 채널 생성 중 오류 발생:', error);
            console.error('에러 응답:', error.response?.data);
            console.error('에러 상태:', error.response?.status);
            console.error('전송된 데이터:', {
                chatRoomId,
                channelName: channelName.trim(),
                maxUsers: maxUsers === 'unlimited' ? null : parseInt(maxUsers),
            });
            toast.error(`음성 채널 생성 중 문제가 발생했습니다. (${error.response?.status || 'Unknown Error'})`);
            handleClose();
        } finally {
            // 생성 완료 후 로딩 상태 해제
            setIsCreating(false);
        }
    };

    return createPortal(
        <div className="modalOverlay" onClick={handleOverlayClick}>
            <div className="modalContent" onClick={handleContentClick}>
                <div className="modalHeader">
                    <h3>음성 채널 생성</h3>
                    <button className="closeBtn" onClick={handleClose}>✖</button>
                </div>
                <div className="modalInContent">
                    <div className="formGroup">
                        <label>음성 채널 이름</label>
                        <input className="modalInput" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
                    </div>
                </div>
                <div className="modalInContent">
                    <div className="formGroup">
                        <label>최대 인원</label>
                        <div className="customDropdown">
                            <div 
                                className="dropdownTrigger" 
                                onClick={toggleDropdown}
                            >
                                <span>{maxUserOptions.find(opt => opt.value === maxUsers)?.label}</span>
                                <span className={`dropdownArrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                            </div>
                            {isDropdownOpen && createPortal(
                                <div 
                                    className="dropdownMenu"
                                    style={{
                                        top: dropdownPosition.top,
                                        left: dropdownPosition.left,
                                        width: dropdownPosition.width
                                    }}
                                >
                                    {maxUserOptions.map((option) => (
                                        <div
                                            key={option.value}
                                            className={`dropdownOption ${maxUsers === option.value ? 'selected' : ''}`}
                                            onClick={() => {
                                                setMaxUsers(option.value);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            {option.label}
                                        </div>
                                    ))}
                                </div>,
                                document.body
                            )}
                        </div>
                    </div>
                    <div className="modalFooter">
                        <button className="createBtn" onClick={createVoiceChannel} disabled={isCreating}>
                            {isCreating ? '생성 중...' : '방 만들기'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );


}

export default CreateVoiceChannelModal;