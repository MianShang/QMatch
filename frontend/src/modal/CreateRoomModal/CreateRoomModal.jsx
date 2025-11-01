import React, { useState, useEffect, useContext } from 'react';
import axios from '@axios';
import { LogContext } from '../../App.jsx';
import './CreateRoomModal.css';

function CreateRoomModal({ setOpenModal, onRoomCreated }) {
  const mapTierIcon = (tierName) => {
    const key = String(tierName || '').toLowerCase();
    const mapping = {
      '아이언': 'iron.png',
      '브론즈': 'bronze.png',
      '실버': 'silver.png',
      '골드': 'gold.png',
      '플레티넘': 'platinum.png',
      '에메랄드': 'emerald.png',
      '다이아몬드': 'diamond.png',
      '마스터': 'master.png',
      '그랜드마스터': 'grandmaster.png',
      '챌린저': 'challenger.png',
    };
    return mapping[tierName] || 'unranked.png';
  };
  const [name, setName] = useState('');
  const [gameName, setGameName] = useState('');
  const [tags, setTags] = useState([]);                 // 태그 목록
  const [selectedTags, setSelectedTags] = useState([]); // 사용자가 선택한 태그
  const [groupedTags, setGroupedTags] = useState({});   // 카테고리별 그룹화
  const { userData } = useContext(LogContext);
  const [errorMsg, setErrorMsg] = useState('');         // 커스텀 에러 메시지
  const [maxUsers, setMaxUsers] = useState(5);         // 방 생성 시 기본값
  const [joinType, setJoinType] = useState('approval'); // 입장 방식: 'approval' (방장 승인) 또는 'free' (자유 입장)
  const [isCreating, setIsCreating] = useState(false);  // 방 생성 중 상태

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
    axios.get(`/api/tags/${gameName}`)
      .then(res => {
        const data = res.data;
        setTags(data);
        // 카테고리 기준 그룹화
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

  // 방 생성 API 호출
  const createRoom = async () => {
    // 이미 생성 중이면 중복 요청 방지
    if (isCreating) {
      return;
    }

    if (!name.trim() || !gameName.trim()) {
      // alert("채팅방 이름과 게임을 입력해주세요!");
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

    // 생성 시작 - 로딩 상태 활성화
    setIsCreating(true);
    setErrorMsg(''); // 에러 메시지 초기화

    // 숫자 배열로 변환
    const tagIds = selectedTags.map(id => Number(id));

    const payload = {
      chatName: name,
      gameName,
      tags: tagIds,                    // 숫자 배열
      creatorUserId: userData.userId,   
      maxUsers,
      joinType                         // 입장 방식 추가
    };

    console.log("📦 createRoom payload:", payload);

    try {
      const res = await axios.post('/api/chat/rooms', payload);
      console.log("방 생성 완료:", res.data);
      
      // 방장은 모든 방에서 자동으로 입장 (자유 입장 방과 방장 승인 방 모두)
      onRoomCreated?.(res.data);
      
      // 방장이 자동으로 입장하도록 바로 채팅방으로 이동
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      
      handleClose();
    } catch (err) {
      console.error(err);
      if (!errorMsg) {
        setErrorMsg(err.message || '방 생성 중 오류가 발생했습니다.');
      }
    } finally {
      // 생성 완료 후 로딩 상태 해제
      setIsCreating(false);
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
            <label>최대 인원 수</label>
            <input
              type="text"
              className="modalInput"
              value={maxUsers}
              min={2}
              max={20}
              onChange={(e) => setMaxUsers(Number(e.target.value))}
              required
            />
            <small>(2 ~ 20명)</small>
            {(maxUsers < 2 || maxUsers > 20) && (
              <p style={{ color: "red" }}>방 인원은 2~20명 사이여야 합니다.</p>
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
                      {/* 티어 아이콘 (롤 티어 전용) */}
                      {category === 'tier' && gameName === 'lol' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <img src={`/tiers/${mapTierIcon(tag.tagName)}`} alt={tag.tagName} style={{ width: 18, height: 18 }} />
                          {tag.tagName}
                        </span>
                      ) : (
                        tag.tagName
                      )}
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
            className="createBtn" 
            onClick={createRoom}
            disabled={isCreating}
          >
            {isCreating ? '생성 중...' : '방 만들기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateRoomModal;
