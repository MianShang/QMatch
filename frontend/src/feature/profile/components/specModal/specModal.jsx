import React, { useEffect, useState } from 'react';
import axios from '@axios';
import DNF from './game/Dnf';
import './specModal.css';

function SpecModal({ game, onClose }) {
  //불러올 게임 스펙 데이터를 저장
  const [gameStats, setGameStats] = useState(null)

  //로딩 상태
  const [isLoading,setIsLoading]= useState(true)

  //에러 상태
  const [error,setError]= useState(null)

  useEffect(()=>{
    if(!game) return;

    setIsLoading(true)
    setGameStats(null)
    setError(null)

    axios.get(`/dnf/stats/by-gamecode`, {
      params: {
        gameCode:game.gameCode
      }
    })
    .then(response => {
      setGameStats(response.data);
    })
    .catch(err=> {
      console.error("캐릭터 조회 실패",err)
      setError("캐릭터 정보를 불러오지 못했어")
    })
    .finally(()=>{
      setIsLoading(false)
    })

  },[game.gameCode]);

  const renderGameComponent = () => {
    if (isLoading) return <p>데이터를 불러오는 중입니다...</p>;
    if (error) return <p>{error}</p>;
    if (!gameStats) return <p>표시할 데이터가 없습니다.</p>;

    console.log("전달된 게임 이름:", game.gameName);

    switch(game.gameName){
      case 'dnf':
        return <DNF dnfStats={gameStats}/>

        default : return <p>지원하지 않는 게임이에요.</p>
    }
  }
  return (
    <div className="spec-modal-container">
    <button className="spec-close-button" onClick={onClose}>
        닫기
    </button>
      <h2>{game.gameName}</h2>
      <p>{game.gameCode}</p>

      {/* 여기에 전적 및 스펙 넣읍시다 */}
      <div className="spec-content-box">
        {renderGameComponent()}
      </div>
    </div>
  );
}

export default SpecModal;
