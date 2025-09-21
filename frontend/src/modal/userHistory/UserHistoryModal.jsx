import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserHistoryModal.css';
import LOLPage from './LOLPage';
import DNFPage from './DNFPage'; 
import LostArkPage from './LostArkPage';
import MaplePage from './MaplePage';

// Riot 전적 캐시: 동일한 gameCode에 대해 중복 요청을 막기 위함
const riotCache = {};
const CACHE_DURATION = 60 * 60 * 1000; // 캐시 유효시간: 1시간 (ms)
const DISPLAY_DELAY = 0;       // 롤 전적 표시 지연시간: 10초 (ms)

function UserHistoryModal({ setUserHistoryOpen, historyUserId, sendToModalGameName }) {
  const [isClosing, setIsClosing] = useState(false);          // 모달 닫힘 애니메이션 제어
  const [userGameCode, setUserGameCode] = useState(null);     // 유저 게임 코드 + riotStats 저장
  const [delayedShow, setDelayedShow] = useState(true);       // 화면 표시 제어 (초기값 true)
  const [errorMessage, setErrorMessage] = useState(null);     // 에러 메시지 상태 추가

  // 모달 닫기
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => setUserHistoryOpen(false), 150);     // 애니메이션 후 종료
  };

  const handleOverlayClick = () => handleClose();        
  const handleContentClick = (e) => e.stopPropagation();  

  // 게임 아이콘 반환 함수
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

  // 유저 ID와 게임 이름을 기반으로 게임코드 및 Riot 전적 조회
  useEffect(() => {
    if (!historyUserId || !sendToModalGameName) return;

    setDelayedShow(true); // 초기값은 표시함

    // 게임코드 조회
    axios.get('/api/get/user/gamedata', {
      params: {
        userId: historyUserId,
        gameName: sendToModalGameName
      }
    })

    .then((res) => {
      const gameCode = res.data?.gameCode;
      if (!gameCode) {
        setUserGameCode(null);
        setErrorMessage("게임 정보를 찾을 수 없습니다."); // gameCode 없을 때 에러 메시지 표시
        return;
      }

      const cached = riotCache[gameCode];
      const now = Date.now();

      const gameData = { gameCode };

      // 캐시가 있으면 그대로 사용
      if (cached && (now - cached.timestamp < CACHE_DURATION)) {
        console.log("캐시 사용됨");
        setUserGameCode(cached.data);
        setErrorMessage(null); // 캐시 성공 시 에러 초기화
        return;
      }

      if (sendToModalGameName === 'lol') {
        setDelayedShow(false);

        setTimeout(async () => {
          try {
            const res2 = await axios.get('/riot/stats/by-gamecode', {
              params: { gameCode }
            });

            gameData.riotStats = res2.data;

            riotCache[gameCode] = {
              data: gameData,
              timestamp: Date.now()
            };

            setUserGameCode(gameData);
            setDelayedShow(true);
            setErrorMessage(null);

          } catch (err2) {
            console.error('라이엇 전적 불러오기 실패', err2);
            setDelayedShow(true);
            setErrorMessage("게임 정보를 찾을 수 없습니다.");
          }
        }, DISPLAY_DELAY);

        return;
      }

      if (sendToModalGameName === 'dnf') {
        (async () => {
          try {
            const res2 = await axios.get('/dnf/stats/by-gamecode', {
              params: { gameCode }
            });
      
            gameData.dnfStats = res2.data;
            setUserGameCode(gameData);
            setErrorMessage(null);
          } catch (err2) {
            console.error('던파 전적 불러오기 실패', err2);
            setErrorMessage("던파 정보를 불러오지 못했습니다.");
          }
        })();
      
        return;
      }

      if (sendToModalGameName === 'lostark') {
        (async () => {
          try {
            const res2 = await axios.get('/lostark/api/character/profile', {
              params: { name: gameCode }
            });
            gameData.lostarkStats = res2.data;
            setUserGameCode(gameData);
            setErrorMessage(null);
            
          } catch (err2) {
            console.error('로스트아크 전적 불러오기 실패', err2);
            setErrorMessage("로스트아크 정보를 불러오지 못했습니다.");
          }
        })();
        return;
      }

      if (sendToModalGameName === 'maplestory') {
        (async () => {
          try {
            const res2 = await axios.get('/maple/api/character', {
              params: { name: gameCode }
            });
            gameData.mapleStats = res2.data;
            setUserGameCode(gameData);
            setErrorMessage(null);
          } catch (err2) {
            console.error('메이플스토리 전적 불러오기 실패', err2);
            setErrorMessage("메이플스토리 정보를 불러오지 못했습니다.");
          }
        })();
        return;
      }

      setUserGameCode(gameData);
      setErrorMessage(null);
    })
    .catch((err) => {
      console.error('게임코드 불러오기 실패', err);
      setUserGameCode(null);
      setErrorMessage("게임 정보를 불러오지 못했습니다.");
    });

  }, [historyUserId, sendToModalGameName]);

  return (
    <div className="modalOverlay userHistoryModal" onClick={handleOverlayClick}>
      <div className={`modalContent ${isClosing ? 'pop-out' : ''}`} onClick={handleContentClick}>

        {/* 모달 헤더 */}
        <div className='modalHeader'>
          <img src={setGameIcon(sendToModalGameName)} alt="게임 아이콘" className="chatCardImage" />
          <h3>{historyUserId ? `${historyUserId} 님의 정보` : "없어"}</h3>
          <div onClick={handleClose}><h3>🗙</h3></div>
        </div>

        {/* 모달 내용 */}
        <div className='modalInContent'>
          {/* <p>{userGameCode ? userGameCode.gameCode : ' '}</p> */}

          {/* 롤 전적은 1분 후에만 표시 */}
          {sendToModalGameName === 'lol' && delayedShow && (
            <LOLPage riotStats={userGameCode?.riotStats} />
          )}

          {/* 처음 불러오는 경우 10초 대기 문구 표시 */}
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

          {/* 에러 메시지 표시 */}
          {errorMessage && (
            <p style={{ color: 'red', fontWeight: 'bold', marginTop: '16px', textAlign: 'center' }}>
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserHistoryModal;
