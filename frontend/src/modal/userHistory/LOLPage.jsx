import React, { useState, useEffect } from 'react';
import './LOLPage.css';

function LOLPage({ riotStats }) {

  // riotStats가 없을 경우 메시지 표시 및 유효한 데이터인지 체크 (tier 또는 most가 없을 경우 예외 처리)
  if (!riotStats || !riotStats.tier || Object.keys(riotStats.most || {}).length === 0) {
    return (
      <div className="lol-box">
      </div>
    );
  }


  const { name, tier, rank, lp, wins, losses, level, most } = riotStats;
  const winRate = wins + losses > 0
    ? `${((wins * 100) / (wins + losses)).toFixed(1)}% (${wins}승 ${losses}패)`
    : '-';

  const [selectedMode, setSelectedMode] = useState('solo');
  /* 컴포넌트 내부에서 상태로 관리 */
  const [version, setVersion] = useState('14.10.1');  
  const tierImageUrl = `/tiers/${tier.toLowerCase()}.png`;

  /* 최신 버전 가져오는 함수 */
  const getLatestVersion = async () => {
    try {
      const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
      const versions = await response.json();
      return versions[0]; // 가장 최신 버전은 배열의 첫 번째에 있습니다.
    } catch (error) {
      console.error("버전 정보를 불러오지 못했습니다.", error);
      return '14.10.1'; // 실패 시 기본 버전 사용
    }
  };

  useEffect(() => {
    const fetchVersion = async () => {
      const latestVersion = await getLatestVersion();
      setVersion(latestVersion);
    };
    fetchVersion();
  }, []);

  return (
    <div className="lol-box">
      <div className="tier-box">
        <img src={tierImageUrl} alt="티어 이미지" className="tier-img" />
        <div className="tier-info">
          <p>이름: {name}</p>
          <p>티어: {tier} {rank} ({lp} LP)</p>
          <p>승률: {winRate}</p>
          <p>레벨: {level}</p>

        </div>
      </div>

      <div className="most-section">

        <p className="most-title">모스트 챔피언</p>


        <div className="mode-buttons">
          {Object.keys(most).map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`mode-button ${selectedMode === mode ? 'active' : ''}`}
            >

              {mode.toUpperCase()}

            </button>
          ))}
        </div>

        <div className="champion-list">
          {most[selectedMode]?.length === 0 ? (
            <div className="champ-item">
              <p className="empty-text">플레이 기록 없음</p>
            </div>
          ) : (
            most[selectedMode].map((champ, idx) => (
              <div className="champ-item" key={idx}>
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.championName}.png`}
                  alt={champ.championName}
                  className="champ-img"
                />
                <p>#{idx + 1}. {champ.championName} - {champ.count}회</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 랭크를 숫자로 바꿔주는 함수
function romanToNumber(roman) {
  switch (roman) {
    case 'I': return 1;
    case 'II': return 2;
    case 'III': return 3;
    case 'IV': return 4;
    default: return 0;
  }
}

export default LOLPage;
