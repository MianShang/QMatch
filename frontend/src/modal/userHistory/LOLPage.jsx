import React, { useState, useEffect } from 'react';
import './LOLPage.css';

function LOLPage({ riotStats }) {
  const [version, setVersion] = useState('14.10.1');   // 최신 LoL 버전
  const [championMap, setChampionMap] = useState({});  // 챔피언 ID ↔ 한글이름/이미지 매핑

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

  const { name, tier, rank, lp, wins, losses, level, championMasteries } = riotStats;
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

  return (
    <div className="lol-box">
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
                  {imgUrl && (
                    <img
                      src={imgUrl}
                      alt={champ.championId}
                      className="champ-img"
                    />
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
  );
}

export default LOLPage;
