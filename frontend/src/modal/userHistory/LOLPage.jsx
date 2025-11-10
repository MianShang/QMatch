import React, { useState, useEffect } from 'react';
import './LOLPage.css';

function LOLPage({ riotStats }) {
  const [version, setVersion] = useState('14.10.1');   // 최신 LoL 버전
  const [championMap, setChampionMap] = useState({});  // 챔피언 ID ↔ 한글이름/이미지 매핑
  const [failedImages, setFailedImages] = useState(new Set()); // 로드 실패한 이미지 URL 저장

  // 최신 버전 API 호출
  const getLatestVersion = async () => {
    try {
      const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
      const versions = await response.json();
      return versions[0];
    } catch (error) {
      console.error('버전 정보를 불러오지 못했습니다.', error);
      return '14.10.1';
    }
  };

  // 챔피언 데이터 로드
  useEffect(() => {
    const fetchChampionData = async () => {
      try {
        const res = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`
        );
        const data = await res.json();

        const mapping = {};
        Object.values(data.data).forEach((champ) => {
          mapping[champ.key] = {
            id: champ.id,     // 영문 id (이미지 파일명)
            name: champ.name, // 한글 이름
          };
          // 영문 이름으로도 매핑 추가
          mapping[champ.id] = {
            id: champ.id,
            name: champ.name,
          };
        });

        setChampionMap(mapping);
      } catch (err) {
        console.error('챔피언 데이터 로드 실패:', err);
      }
    };

    if (version) fetchChampionData();
  }, [version]);

  // 최신 버전 갱신
  useEffect(() => {
    const fetchVersion = async () => {
      const latestVersion = await getLatestVersion();
      setVersion(latestVersion);
    };
    fetchVersion();
  }, []);

  // riotStats 없을 때는 Hook 실행 끝난 후 처리
  if (!riotStats || !riotStats.tier) {
    return <div className="lol-box">데이터가 없습니다.</div>;
  }

  const { name, tier, rank, lp, wins, losses, level, championMasteries, matchHistory } = riotStats;
  
  const winRate =
    wins + losses > 0
      ? `${((wins * 100) / (wins + losses)).toFixed(1)}% (${wins}승 ${losses}패)`
      : '-';
  const tierImageUrl = `/tiers/${tier.toLowerCase()}.png`;

  // ID → 이름
  const getChampionNameById = (id) =>
    championMap[id?.toString()]?.name || `Unknown(${id})`;

  // ID → 이미지
  const getChampionImgUrl = (id) => {
    const champId = championMap[id?.toString()]?.id;
    return champId
      ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champId}.png`
      : null;
  };

  // 챔피언 이름으로 이미지 URL 가져오기 (영문 이름 또는 한글 이름 모두 지원)
  const getChampionImgUrlByName = (championName) => {
    // championMap에서 찾기 (key는 숫자, id는 영문 이름)
    const champ = Object.values(championMap).find(c => 
      c.id === championName || c.name === championName
    );
    if (champ) {
      return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.id}.png`;
    }
    // 찾지 못한 경우 영문 이름으로 직접 시도
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championName}.png`;
  };

  // 이미지 로딩 실패 핸들러
  const handleImageError = (e, imgUrl) => {
    if (imgUrl && !failedImages.has(imgUrl)) {
      setFailedImages(prev => new Set([...prev, imgUrl]));
    }
    // 이미지 로드 실패 시 빈 이미지로 대체
    e.target.style.display = 'none';
  };

  // 게임 시간 포맷팅 (초 → 분:초)
  const formatGameDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 날짜 포맷팅
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  // 매치 히스토리 최대 10게임까지만 표시
  const displayMatchHistory = Array.isArray(matchHistory) && matchHistory.length > 0 
    ? matchHistory.slice(0, 10) 
    : [];

  return (
    <div className="lol-box">
      {/* 상단: 티어 박스와 숙련도 챔피언 */}
      <div className="lol-top-section">
        {/* 티어 박스 */}
        <div className="tier-box">
          <img src={tierImageUrl} alt="티어 이미지" className="tier-img" />
          <div className="tier-info">
            <p>이름: {name}</p>
            <p>티어: {tier} {rank} ({lp} LP)</p>
            <p>승률: {winRate}</p>
            <p>레벨: {level}</p>
          </div>
        </div>

        {/* 숙련도 챔피언 */}
        <div className="most-section">
          <p className="most-title">챔피언 숙련도 (Top 3)</p>
          <div className="champion-list">
            {!championMasteries || championMasteries.length === 0 ? (
              <div className="champ-item">
                <p className="empty-text">숙련도 데이터 없음</p>
              </div>
            ) : (
              championMasteries.map((champ, idx) => {
                const imgUrl = getChampionImgUrl(champ.championId);
                return (
                  <div className="champ-item" key={idx}>
                    {imgUrl && !failedImages.has(imgUrl) && (
                      <img
                        src={imgUrl}
                        alt={champ.championId}
                        className="champ-img"
                        onError={(e) => handleImageError(e, imgUrl)}
                        loading="lazy"
                      />
                    )}
                    {(!imgUrl || failedImages.has(imgUrl)) && (
                      <div className="champ-img champ-placeholder">
                        {getChampionNameById(champ.championId)?.charAt(0) || '?'}
                      </div>
                    )}
                    <p>
                      #{idx + 1}. {getChampionNameById(champ.championId)} -{' '}
                      {champ.championPoints.toLocaleString()}점
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 하단: 매치 히스토리 */}
      <div className="match-history-section">
        <p className="match-history-title">최근 전적 (최대 10게임)</p>
        <div className="match-history-list">
          {displayMatchHistory.length > 0 ? (
            displayMatchHistory.map((match, idx) => {
              const champImgUrl = getChampionImgUrlByName(match.championName);
              const kda = match.deaths === 0 
                ? 'Perfect' 
                : ((match.kills + match.assists) / match.deaths).toFixed(2);
              const kdaColor = match.deaths === 0 
                ? '#ffd700' 
                : (match.kills + match.assists) / match.deaths >= 3 
                  ? '#43b581' 
                  : (match.kills + match.assists) / match.deaths >= 2 
                    ? '#faa61a' 
                    : '#f04747';

              return (
                <div className={`match-item ${match.win ? 'match-win' : 'match-loss'}`} key={idx}>
                  {champImgUrl && !failedImages.has(champImgUrl) && (
                    <img
                      src={champImgUrl}
                      alt={match.championName}
                      className="match-champ-img"
                      onError={(e) => handleImageError(e, champImgUrl)}
                      loading="lazy"
                    />
                  )}
                  {(!champImgUrl || failedImages.has(champImgUrl)) && (
                    <div className="match-champ-img match-champ-placeholder">
                      {match.championName?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="match-info">
                    <div className="match-header">
                      <span className={`match-result ${match.win ? 'win' : 'loss'}`}>
                        {match.win ? '승리' : '패배'}
                      </span>
                      <span className="match-mode">{match.gameMode}</span>
                      <span className="match-time">{formatDate(match.gameStartTimestamp)}</span>
                    </div>
                    <div className="match-details">
                      <span className="match-champion">
                        {championMap[match.championName]?.name || 
                         Object.values(championMap).find(c => c.id === match.championName)?.name || 
                         match.championName}
                      </span>
                      <span className="match-kda" style={{ color: kdaColor }}>
                        {match.kills} / {match.deaths} / {match.assists} (KDA: {kda})
                      </span>
                      <span className="match-duration">{formatGameDuration(match.gameDuration)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-text" style={{ padding: '20px', textAlign: 'center' }}>
              {matchHistory === null || matchHistory === undefined 
                ? '전적 데이터를 불러오는 중입니다...' 
                : matchHistory.length === 0 
                  ? '전적 데이터가 없습니다.' 
                  : '전적 데이터를 표시할 수 없습니다.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LOLPage;
