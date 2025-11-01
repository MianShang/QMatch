import React, { useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import axios from '@axios';
import { toast } from 'react-toastify';
import './CreateVoiceChannelModal.css';

function CreateVoiceChannelModal({ setShowCreateVoiceChannelModal, chatRoomId, onVoiceChannelCreated, roomMaxUsers }) {
  const [channelName, setChannelName] = useState('');
  const [maxUsers, setMaxUsers] = useState('unlimited');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [existingChannels, setExistingChannels] = useState([]);

  // 드롭다운 옵션 생성
  const maxUserOptions = [
    { value: 'unlimited', label: '인원 제한 없음' },
    ...Array.from({ length: roomMaxUsers - 2 }, (_, i) => ({
      value: (i + 2).toString(),
      label: `${i + 2}명`
    }))
  ];

  // 기존 채널 목록 불러오기
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await axios.get(`/api/voice/channels/${chatRoomId}`);
        if (res.status === 200) setExistingChannels(res.data);
      } catch (err) {
        console.error('기존 채널 목록 조회 실패:', err);
      }
    };
    if (chatRoomId) fetchChannels();
  }, [chatRoomId]);

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
    if (isCreating) return;

    // 이름 유효성 검사
    if (!channelName || channelName.trim() === '') {
      setErrorMessage('음성 채널 이름을 입력해주세요.');
      return;
    }

    // 중복 이름 검사
    const nameExists = existingChannels.some(
      (ch) => ch.voiceChannelName === channelName.trim()
    );
    if (nameExists) {
      setErrorMessage('같은 이름의 채널이 이미 존재합니다.');
      return;
    }

    setErrorMessage('');
    setIsCreating(true);

    try {
      const requestData = {
        chatRoomId: chatRoomId,
        voiceChannelName: channelName.trim(),
        maxUsers: maxUsers === 'unlimited' ? null : parseInt(maxUsers)
      };

      const res = await axios.post('/api/voice/channels', requestData, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.status === 200 || res.status === 201) {
        onVoiceChannelCreated(res.data);
        handleClose();
      } else {
        throw new Error('음성 채널 생성 실패');
      }
    } catch (error) {
      console.error('음성 채널 생성 중 오류:', error);
      setErrorMessage('음성 채널 생성 중 문제가 발생했습니다.');
    } finally {
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
            {errorMessage && <div className="errorText">{errorMessage}</div>}
            <input
              className={`modalInput ${errorMessage ? 'inputError' : ''}`}
              value={channelName}
              onChange={(e) => {
                setChannelName(e.target.value);
                setErrorMessage('');
              }}
            />
          </div>
        </div>

        <div className="modalInContent">
          <div className="formGroup">
            <label>최대 인원</label>
            <div className="customDropdown">
              <div className="dropdownTrigger" onClick={toggleDropdown}>
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
            <button
              className="createBtn"
              onClick={createVoiceChannel}
              disabled={isCreating}
            >
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
