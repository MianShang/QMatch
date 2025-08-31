import React, { useMemo, useEffect, useState, useRef } from 'react';
import './JoinRoomModal.css';

function JoinRoomModal({ open, onClose, room, onJoin }) {
  if (!open || !room) return null;

  const [detail, setDetail] = useState(null);      // 상세 데이터 (태그 포함)
  const joiningRef = useRef(false);

  const handleJoin = async () => { 
    if (joiningRef.current) return;
    joiningRef.current = true;
    try {
      await onJoin({ roomId: room.id ?? room.roomId, chatName, gameName, tagNames });
      onClose?.();
    } finally {
      joiningRef.current = false;
    }
  };

  // 모달 열릴 때 방 상세 조회 (tagNames, gameName 등 받기)
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/chat/rooms/${room.id ?? room.roomId}`);
        if (!res.ok) throw new Error('room detail fetch failed');
        const data = await res.json(); // 기대: { id, name, chatName, gameName, tagNames: [...] }
        if (active) setDetail(data);
      } catch (e) {
        console.warn('방 상세 조회 실패, props로 표시:', e);
        if (active) setDetail(null); // props fallback 사용
      }
    }
    load();
    return () => { active = false; };
  }, [room]);

  const chatName = (detail?.chatName ?? detail?.name) || room.chatName || room.name || '-';
  const gameName = detail?.gameName || room.gameName || room.game || '-';

  // 우선 상세(tagNames) > props(room.tags) > 빈 배열
  const tagNames = useMemo(() => {
    if (Array.isArray(detail?.tagNames) && detail.tagNames.length) return detail.tagNames;
    if (Array.isArray(detail?.chatRoomTags) && detail.chatRoomTags.length) {
      return detail.chatRoomTags.map(ct => ct?.gameTag?.tagName).filter(Boolean);
    }
    if (Array.isArray(room?.tagNames) && room.tagNames.length) return room.tagNames;
    if (Array.isArray(room?.tags) && room.tags.length) {
      return room.tags.map(t => (typeof t === 'object' ? (t.tagName ?? t.name) : String(t))).filter(Boolean);
    }
    return [];
  }, [detail, room]);

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e)=>e.stopPropagation()}>
        <div className="modalHeader">
          <h3>채팅방 입장</h3>
          <button className="closeBtn" onClick={onClose}>✖</button>
        </div>

        <div className="modalInContent">
          <div className="formGroup">
            <label>채팅방 이름</label>
            <div className="infoText">{chatName}</div>
          </div>

          <div className="formGroup">
            <label>방장</label>
            <div className="infoText">{detail?.hostName || room.hostName || '-'}</div>
          </div>

          <div className="formGroup">
            <label>게임</label>
            <div className="infoText">{gameName}</div>
          </div>

          {!!tagNames.length && (
            <div className="formGroup">
              <label>태그</label>
              <div className="tagContainer">
                {tagNames.map((nm, i) => (
                  <span key={`${nm}-${i}`} className="tagBadge">#{nm}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="footerArea">
          <button
            type="button"               
            className="joinBtn"
            onClick={handleJoin}        
            disabled={joiningRef.current}
            >
          {joiningRef.current ? '입장 중…' : '입장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinRoomModal;
