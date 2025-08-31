import React, { useState, useEffect } from 'react';
import './CreateRoomModal.css';

function CreateRoomModal({ setOpenModal, onRoomCreated }) {
  const [name, setName] = useState('');
  const [gameName, setGameName] = useState('');
  const [tags, setTags] = useState([]);                 // 태그 목록
  const [selectedTags, setSelectedTags] = useState([]); // 사용자가 선택한 태그

  // 모달 닫기 핸들러
  const handleClose = () => {
    setOpenModal(false);
  };

  // 모달 배경 클릭 처리
  const handleOverlayClick = () => handleClose();
  const handleContentClick = (e) => e.stopPropagation();

  // 게임 선택 시 태그 불러오기
  useEffect(() => {
    if (!gameName) return;
    fetch(`/api/tags/${gameName}`)
      .then(res => res.json())
      .then(data => setTags(data))
      .catch(err => console.error(err));
  }, [gameName]);

  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // 방 생성 API 호출
  const createRoom = () => {
    if (!name.trim() || !gameName.trim()) {
      alert("채팅방 이름과 게임을 입력해주세요!");
      return;
    }

    fetch('/api/chat/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatName: name, gameName, tags: selectedTags }),
    })
      .then(async res => {
        if (!res.ok) throw new Error('방 생성 실패');
        return res.json();
      })
      .then(data => {
        onRoomCreated(data);
        handleClose();
      })
      .catch(err => {
        alert('방 생성 중 오류가 발생했습니다.');
        console.error(err);
      });
  };

  return (
    // 모달 전체 배경
    <div className="modalOverlay" onClick={handleOverlayClick}>
      {/* 모달 본문 */}
      <div className="modalContent" onClick={handleContentClick}>
        
        {/* 모달 헤더 */}
        <div className="modalHeader">
          <h3>채팅방 생성</h3>
          <button className="closeBtn" onClick={handleClose}>✖</button>
        </div>

        {/* 입력 폼 영역 */}
        <div className="modalInContent">
          {/* 채팅방 이름 입력 */}
          <div className="formGroup">
            <label>채팅방 이름</label>
            <input className="modalInput" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* 게임 선택 */}
          <div className="formGroup">
            <label>게임 선택</label>
            <select className="modalSelect" value={gameName} onChange={(e) => setGameName(e.target.value)}>
              <option disabled value="">-- 선택 --</option>
              <option value="lol">롤</option>
              <option value="maplestory">메이플스토리</option>
              <option value="lostark">로스트아크</option>
              <option value="tft">TFT</option>
              <option value="dnf">던전앤파이터</option>
            </select>
          </div>

          {/* 태그 선택 */}
          <div className="formGroup">
            <label>태그 선택</label>
            <div className="tagContainer">
              {tags.map(tag => (
                <label key={tag.id} className="tagCheckbox">
                  <input
                    type="checkbox"
                    value={tag.id}
                    checked={selectedTags.includes(tag.id)}
                    onChange={(e) => toggleTag(tag.id)}
                  />
                  {tag.tagName}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="footerArea">
          <button className="createBtn" onClick={createRoom}>방 만들기</button>
        </div>
      </div>
    </div>
  );
}

export default CreateRoomModal;
