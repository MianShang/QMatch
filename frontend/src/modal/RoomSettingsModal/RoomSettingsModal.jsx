import React, { useState, useEffect, useContext } from 'react';
import { LogContext } from '../../App.jsx';
import './RoomSettingsModal.css';

function RoomSettingsModal({ open, onClose, room, onRoomUpdated }) {
  const [name, setName] = useState('');
  const [gameName, setGameName] = useState('');
  const [tags, setTags] = useState([]);                 // 태그 목록
  const [selectedTags, setSelectedTags] = useState([]); // 사용자가 선택한 태그
  const [groupedTags, setGroupedTags] = useState({});   // 카테고리별 그룹화
  const { userData } = useContext(LogContext);
  const [errorMsg, setErrorMsg] = useState('');         // 커스텀 에러 메시지
  const [maxUsers, setMaxUsers] = useState(5);         // 방 인원
  const [joinType, setJoinType] = useState('approval'); // 입장 방식: 'approval' (방장 승인) 또는 'free' (자유 입장)
  const [isUpdating, setIsUpdating] = useState(false);

  // 모달이 열릴 때 현재 방 정보로 초기화
  useEffect(() => {
    if (open && room) {
      setName(room.name || '');
      setGameName(room.gameName || '');
      setMaxUsers(room.maxUsers || 5);
      setJoinType(room.joinType || 'approval');
      setSelectedTags(room.tagNames ? room.tagNames.map(tagName => {
        // tagName으로부터 tagId를 찾아야 함
        const tag = tags.find(t => t.tagName === tagName);
        return tag ? tag.id : null;
      }).filter(Boolean) : []);
    }
  }, [open, room, tags]);

  // 모달 닫기 핸들러
  const handleClose = () => {
    setErrorMsg('');
    onClose?.();
  };

  // 모달 배경 클릭 처리
  const handleOverlayClick = () => handleClose();
  const handleContentClick = (e) => e.stopPropagation();

  // 게임 선택 시 태그 불러오기
  useEffect(() => {
    if (!gameName) return;
    fetch(`/api/tags/${gameName}`)
      .then(res => res.json())
      .then(data => {
        setTags(data);
        const grouped = data.reduce((acc, tag) => {
          const category = tag.category || '기타';
          if (!acc[category]) acc[category] = [];
          acc[category].push(tag);
          return acc;
        }, {});
        setGroupedTags(grouped);
      })
      .catch(err => console.error(err));
  }, [gameName]);

  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // 방 설정 업데이트 API 호출
  const updateRoom = async () => {
    if (!name.trim() || !gameName.trim()) {
      setErrorMsg("채팅방 이름과 게임을 입력해주세요!");
      return;
    }

    if (!userData?.userId) {
      alert("로그인 정보가 없습니다. 다시 로그인 해주세요.");
      return;
    }

    if (maxUsers < 2 || maxUsers > 20) {
      setErrorMsg("인원 수는 2명 이상 20명 이하만 가능합니다.");
      return;
    }

    if (maxUsers < room.currentUsers) {
      setErrorMsg("현재 인원보다 적게 설정할 수 없습니다.");
      return;
    }

    setIsUpdating(true);

    // 숫자 배열로 변환
    const tagIds = selectedTags.map(id => Number(id));

    const payload = {
      requesterUserId: userData.userId,
      chatName: name,
      gameName,
      tags: tagIds,                    // 숫자 배열
      maxUsers,
      joinType                         // 입장 방식 추가
    };

    console.log("📦 updateRoom payload:", payload);

    try {
      const res = await fetch(`/api/chat/rooms/${room.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // 백엔드가 ResponseStatusException으로 보낸 바디 읽기
        let msg = '방 설정 업데이트 실패';
        try {
          const errBody = await res.json();
          console.log("🔎 error body:", errBody);
          msg = errBody?.error || errBody?.message || msg;
        } catch (_) {}
        throw new Error(msg);
      }

      const data = await res.json();
      console.log("방 설정 업데이트 완료:", data);
      
      // 부모 컴포넌트에 업데이트 알림
      onRoomUpdated?.(data);
      
      handleClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || '방 설정 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!open || !room) return null;

  return (
    // 모달 전체 배경
    <div className="modalOverlay" onClick={handleOverlayClick}>
      {/* 모달 본문 */}
      <div className="modalContent" onClick={handleContentClick}>
        
        {/* 모달 헤더 */}
        <div className="modalHeader">
          <h3>방 설정</h3>
          <button className="closeBtn" onClick={handleClose}>✖</button>
        </div>
        {errorMsg && <div className="errorMsg">{errorMsg}</div>}
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

          <div className="formGroup">
            <label>최대 인원</label>
            <input
              type="number"
              className="modalInput"
              value={maxUsers}
              min={2}
              max={20}
              onChange={(e) => setMaxUsers(Number(e.target.value))}
              required
            />
            <small>(2 ~ 20명, 현재: {room.currentUsers}명)</small>
            {(maxUsers < 2 || maxUsers > 20) && (
              <p style={{ color: "red" }}>방 인원은 2~20명 사이여야 합니다.</p>
            )}
            {maxUsers < room.currentUsers && (
              <p style={{ color: "red" }}>현재 인원보다 적게 설정할 수 없습니다.</p>
            )}
          </div>

          {/* 입장 방식 선택 */}
          <div className="formGroup">
            <label>입장 방식</label>
            <div className="joinTypeContainer">
              <label className="joinTypeOption">
                <input
                  type="radio"
                  name="joinType"
                  value="approval"
                  checked={joinType === 'approval'}
                  onChange={(e) => setJoinType(e.target.value)}
                />
                <span>방장 승인</span>
                <small>방장이 승인해야 입장 가능</small>
              </label>
              <label className="joinTypeOption">
                <input
                  type="radio"
                  name="joinType"
                  value="free"
                  checked={joinType === 'free'}
                  onChange={(e) => setJoinType(e.target.value)}
                />
                <span>자유 입장</span>
                <small>누구나 자유롭게 입장 가능</small>
              </label>
            </div>
          </div>

          {/* 태그 선택 (카테고리/티어 그룹) */}
          <div className="formGroup">
            <label>태그 선택</label>
            {Object.keys(groupedTags).map((category) => (
              <div key={category} className="tag-section">
                <p className="tag-title">
                  {category === 'tier' ? '티어' : category === 'line' ? '라인' : category === 'class' ? '직업/보스' : category}
                </p>
                <div className="tagContainer">
                  {groupedTags[category].map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      className={`tagButton ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.tagName}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="footerArea">
          <button 
            className="updateBtn" 
            onClick={updateRoom}
            disabled={isUpdating}
          >
            {isUpdating ? '업데이트 중...' : '설정 업데이트'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomSettingsModal;
