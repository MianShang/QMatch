import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from '@axios';
import './UserHistoryModal.css';
import LOLPage from './LOLPage';
import DNFPage from './DNFPage'; 
import LostArkPage from './LostArkPage';
import MaplePage from './MaplePage';

const riotCache = {};
const CACHE_DURATION = 60 * 60 * 1000; 
const DISPLAY_DELAY = 0; 

function UserHistoryModal({ setUserHistoryOpen, historyUserId, sendToModalGameName, sendToModalGameCode }) {
  const [isClosing, setIsClosing] = useState(false); // 모달 닫힘 애니메이션 제어
  const [userGameCode, setUserGameCode] = useState(null); // 유저 게임 코드 + riotStats 저장
  const [delayedShow, setDelayedShow] = useState(true);  // 화면 표시 제어 (초기값 true)
  const [errorMessage, setErrorMessage] = useState(null); // 에러 메시지 상태 추가
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => setUserHistoryOpen(false), 150); 
  };

  const handleOverlayClick = () => handleClose(); 
  const handleContentClick = (e) => e.stopPropagation(); 

  function setGameIcon(gameName) {
    switch (gameName) {
      case "overwatch": return "/gameIcons/overwatch_Icon.png";
      case "lol": return "/gameIcons/lol_Icon.png";
      case "dnf": return "/gameIcons/dnf_Icon.png";
      case "maplestory": return "/gameIcons/maplestory_Icon.png";
      case "lostark": return "/gameIcons/lostark_Icon.png";
      default: return "https://placehold.co/45";
    }
  }

  useEffect(() => {
    //모달 닫기 
    if (!historyUserId || !sendToModalGameName) return;

    setDelayedShow(true); 
    setErrorMessage(null);
    setUserGameCode(null); 

    const loadGameData = async () => {
      let gameCode; 

      try {
        if (sendToModalGameCode) {
          gameCode = sendToModalGameCode;
        } else {
          const res = await axios.get('/api/get/user/gamedata', {
            params: {
              userId: historyUserId,
              gameName: sendToModalGameName
            }
          });
          gameCode = res.data?.gameCode;
        }

        if (!gameCode) {
          return;
        }

        const gameData = { gameCode }; 

        if (sendToModalGameName === 'lol') {
          const cached = riotCache[gameCode];
          const now = Date.now();
          
          // 캐시가 있더라도 매치 히스토리가 없으면 새로 가져오기
          if (cached && (now - cached.timestamp < CACHE_DURATION) && cached.data?.riotStats?.matchHistory) {
            setUserGameCode(cached.data);
            return; 
          }

          setDelayedShow(false); 
          await new Promise(resolve => setTimeout(resolve, DISPLAY_DELAY)); 
          const res2 = await axios.get('/riot/stats/by-gamecode', { params: { gameCode } });
          gameData.riotStats = res2.data;
          riotCache[gameCode] = { data: gameData, timestamp: Date.now() }; 
          setUserGameCode(gameData);
          setDelayedShow(true); 
          return; 
        }

        if (sendToModalGameName === 'dnf') {
          const res2 = await axios.get('/dnf/stats/by-gamecode', { params: { gameCode } });
          gameData.dnfStats = res2.data;
          setUserGameCode(gameData);
          return; 
        }

        if (sendToModalGameName === 'lostark') {
          const res2 = await axios.get('/lostark/api/character/profile', { params: { name: gameCode } });
          gameData.lostarkStats = res2.data;
          setUserGameCode(gameData);
          return; 
        }

        if (sendToModalGameName === 'maplestory') {
          const res2 = await axios.get('/maple/api/character', { params: { name: gameCode } });
          gameData.mapleStats = res2.data;
          setUserGameCode(gameData);
          return; 
        }
        setUserGameCode(gameData);
      } catch (err) {
        console.error('게임 데이터 로드 중 오류', err);
        setErrorMessage("정보를 불러오는 중 오류가 발생했습니다.");
        if (sendToModalGameName === 'lol') setDelayedShow(true); 
      }
    };
    loadGameData();
  }, [historyUserId, sendToModalGameName, sendToModalGameCode]); 

  return createPortal(
    <div className="modalOverlay userHistoryModal" onClick={handleOverlayClick}>
      <div className={`modalContent ${isClosing ? 'pop-out' : ''}`} onClick={handleContentClick}>

        <div className='modalHeader'>
          <img src={setGameIcon(sendToModalGameName)} alt="게임 아이콘" className="chatCardImage" />
          <h3>{historyUserId ? `${historyUserId} 님의 정보` : "없어"}</h3>
          <div onClick={handleClose}><h3>🗙</h3></div>
        </div>

        <div className='modalInContent'>

          {sendToModalGameName === 'lol' && delayedShow && (
            <LOLPage riotStats={userGameCode?.riotStats} />
          )}

          {sendToModalGameName === 'lol' && !delayedShow && (
            <p style={{ color: '#aaa', fontStyle: 'italic', marginTop: '12px' }}>
              데이터를 불러오는 중입니다. 잠시만 기다려 주세요.
            </p>
          )}

          {sendToModalGameName === 'dnf' && (
            <DNFPage dnfStats={userGameCode?.dnfStats} />
          )}

          {sendToModalGameName === 'lostark' && (
            <LostArkPage lostarkStats={userGameCode?.lostarkStats}/>
          )}

          {sendToModalGameName === 'maplestory' && (
            <MaplePage mapleStats={userGameCode?.mapleStats}/>
          )}

          {errorMessage && (
            <p style={{ color: 'red', fontWeight: 'bold', marginTop: '16px', textAlign: 'center' }}>
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default UserHistoryModal;