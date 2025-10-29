import React, { useState } from 'react';
import { toast } from 'react-toastify'; // alert 대신 toast를 사용하기 위해 import
import './inputModal.css';

// 던전앤파이터 서버 목록
const dnfServers = ['카인', '디레지에', '시로코', '프레이', '카시야스', '힐더', '안톤', '바칼'];

// 게임 또는 태그를 추가하는 모달창 컴포넌트
function InputModal({ type, onClose, sendUserGameCode, sendUserTag }) {
  const [gameName, setGameName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [tag, setTag] = useState('');
  const [server, setServer] = useState('');

  // '저장' 버튼 클릭 시 입력된 데이터를 부모 컴포넌트로 전송하는 함수
  const handleSave = () => {
    if (type === 'game') {
      if (!gameName || !gameCode || (gameName === 'dnf' && !server)) {
        toast.warn("모든 항목을 입력해주세요.");
        return;
      }
      const finalCode = gameName === 'dnf' ? `${server}-${gameCode}` : gameCode;
      sendUserGameCode(gameName, finalCode);
    } else if (type === 'tag') {
      if (!tag) {
        toast.warn("#태그를 입력해주세요.");
        return;
      }
      sendUserTag(tag);
    }
    onClose(); 
  };

  return (
    <div className="input-modal-overlay" onClick={onClose}>
      <div className="input-modal-content"  onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px", padding: "1.5rem" }}>
        <h3>{type === 'game' ? "게임 코드 추가" : "태그 추가"}</h3>

        {type === 'game' && (
          <>
            <label>게임 선택</label>
            <select value={gameName} onChange={(e) => setGameName(e.target.value)}>
              <option value="">-- 선택해주세요 --</option>
              <option value="overwatch">오버워치</option>
              <option value="lol">롤</option>
              <option value="maplestory">메이플스토리</option>
              <option value="lostark">로스트아크</option>
              <option value="dnf">던전앤파이터</option>
            </select>

            {gameName === 'dnf' && (
              <>
                <label>던파 서버 선택</label>
                <select value={server} onChange={(e) => setServer(e.target.value)}>
                  <option value="">-- 서버 선택 --</option>
                  {dnfServers.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              </>
            )}

            <label>게임 코드</label>
            <input className="input-text"
              type="text"
              placeholder="게임 코드를 입력하세요"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
            />
          </>
        )}

        {type === 'tag' && (
          <>
            <label>#태그 입력</label>
            <input className="input-text"
              type="text"
              placeholder="#태그를 입력하세요"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
          </>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <span className="check-btn" onClick={onClose}>취소</span>
          <span className="check-btn" onClick={handleSave}>저장</span>
        </div>
      </div>
    </div>
  );
}

export default InputModal;