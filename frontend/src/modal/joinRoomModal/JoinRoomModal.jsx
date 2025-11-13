import React, { useMemo, useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LogContext } from '../../App.jsx';
import './JoinRoomModal.css';

function JoinRoomModal({ open, onClose, room, onJoin }) {
  if (!open || !room) return null;

  const { userData } = useContext(LogContext);
  const [detail, setDetail] = useState(null);      // 상세 데이터 (태그 포함)
  const joiningRef = useRef(false);

  const handleJoin = async () => { 
    if (joiningRef.current) return;
    
    // 게임 이름 확인
    const currentGameName = detail?.gameName || room.gameName || room.game;
    if (!currentGameName || currentGameName === '-') {
      toast.error("게임 정보를 확인할 수 없습니다.");
      return;
    }

    // 해당 게임의 게임 코드가 있는지 확인
    try {
      const gameCodeResponse = await axios.get("/api/get/user/gamecode", {
        params: { userId: userData?.userId }
      });
      const gameCodes = gameCodeResponse.data || [];
      const hasGameCode = gameCodes.some(code => code.gameName === currentGameName);
      
      if (!hasGameCode) {
        const gameNameMap = {
          'lol': '롤',
          'maplestory': '메이플스토리',
          'lostark': '로스트아크',
          'tft': 'TFT',
          'dnf': '던전앤파이터'
        };
        const gameDisplayName = gameNameMap[currentGameName] || currentGameName;
        toast.error(`${gameDisplayName} 게임 코드를 먼저 등록해주세요.`);
        return;
      }
    } catch (err) {
      console.error("게임 코드 확인 실패:", err);
      toast.error("게임 코드 확인 중 오류가 발생했습니다.");
      return;
    }

    joiningRef.current = true;
    try {
      await onJoin({ roomId: room.id ?? room.roomId, chatName, gameName, tagNames, joinType });
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
  const currentUsers = (typeof detail?.currentUsers === 'number') ? detail.currentUsers : room.currentUsers;
  const maxUsers = (typeof detail?.maxUsers === 'number') ? detail.maxUsers : room.maxUsers;
  const joinType = detail?.joinType || room.joinType || 'approval';
  
  // 방장 닉네임 가져오기
  const [hostNickname, setHostNickname] = useState(null);
  
  useEffect(() => {
    const hostUserId = detail?.hostUserId || room.hostUserId;
    if (!hostUserId) {
      setHostNickname(null);
      return;
    }
    
    // detail이나 room에서 hostNickname이 있으면 사용
    if (detail?.hostNickname || room.hostNickname) {
      setHostNickname(detail?.hostNickname || room.hostNickname);
      return;
    }
    
    // hostNickname이 없으면 프로필 API로 가져오기
    const fetchHostNickname = async () => {
      try {
        const response = await axios.get("/api/profile/user/info", {
          params: { userId: hostUserId }
        });
        const nickname = response.data.userNickname || response.data.userNickName;
        if (nickname) {
          setHostNickname(nickname);
        }
      } catch (error) {
        console.error('방장 닉네임 가져오기 실패:', error);
      }
    };
    
    fetchHostNickname();
  }, [detail?.hostUserId, room.hostUserId, detail?.hostNickname, room.hostNickname]);
  
  // 방장 표시 이름 가져오기
  const getHostDisplayName = () => {
    if (hostNickname) return hostNickname;
    return detail?.hostName || room.hostName || '-';
  };

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
            <div className="infoText">{getHostDisplayName()}</div>
          </div>

          <div className="formGroup">
            <label>입장 방식</label>
            <div className="infoText">
              {joinType === 'free' ? '자유 입장' : '방장 승인'}
            </div>
          </div>

          <div className="formGroup">
            <label>게임</label>
            <div className="infoText">{gameName}</div>
          </div>

          {(typeof currentUsers === 'number' && typeof maxUsers === 'number') && (
            <div className="formGroup">
              <label>인원</label>
              <div className="infoText">{currentUsers} / {maxUsers}</div>
            </div>
          )}

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
            disabled={joiningRef.current || (typeof currentUsers === 'number' && typeof maxUsers === 'number' && currentUsers >= maxUsers)}
            >
          {joiningRef.current 
            ? '신청 중…' 
            : ((typeof currentUsers === 'number' && typeof maxUsers === 'number' && currentUsers >= maxUsers) 
              ? '입장 불가' 
              : (joinType === 'free' ? '입장하기' : '입장 신청'))}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinRoomModal;
