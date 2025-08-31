import React, { useState, useEffect, useContext } from 'react';
import { LogContext } from '../../App.jsx';
import './CreateRoomModal.css';

function CreateRoomModal({ setOpenModal, onRoomCreated }) {
  const [name, setName] = useState('');
  const [gameName, setGameName] = useState('');
  const [tags, setTags] = useState([]);                 // 태그 목록
  const [selectedTags, setSelectedTags] = useState([]); // 사용자가 선택한 태그
  const { userData } = useContext(LogContext);

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
  const createRoom = async () => {
    if (!name.trim() || !gameName.trim()) {
      alert("채팅방 이름과 게임을 입력해주세요!");
      return;
    }

    if (!userData?.userId) {
      alert("로그인 정보가 없습니다. 다시 로그인 해주세요.");
      return;
    }

    // 숫자 배열로 변환
    const tagIds = selectedTags.map(id => Number(id));

    const payload = {
      chatName: name,
      gameName,
      tags: tagIds,                    // 숫자 배열
      creatorUserId: userData.userId   // 반드시 포함 (백엔드가 findByUserId로 조회)
    };

    console.log("📦 createRoom payload:", payload);

    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // 백엔드가 ResponseStatusException으로 보낸 바디 읽기
        let msg = '방 생성 실패';
        try {
          const errBody = await res.json();
          console.log("🔎 error body:", errBody);
          msg = errBody?.error || errBody?.message || msg;
        } catch (_) {}
        throw new Error(msg);
      }

      const data = await res.json();
      console.log("✅ 방 생성 완료:", data);
      onRoomCreated?.(data);
      handleClose();
    } catch (err) {
      console.error(err);
      alert(err.message || '방 생성 중 오류가 발생했습니다.');
    }
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
