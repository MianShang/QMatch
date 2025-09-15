import React from "react";
import './LostArkPage.css';

function LostArkPage({ lostarkStats }) {
  if (!lostarkStats) return null;

  const {
    CharacterImage,
    CharacterName,
    CharacterClassName,
    ExpeditionLevel,
    ItemAvgLevel,
    CombatPower,
    CharacterLevel,
    ServerName
  } = lostarkStats;

  return (
    <div className="lostark-box">
      {/* 캐릭터 이미지 컨테이너 */}
      <div className="lostark-image-container">
        <img 
          src={CharacterImage} 
          alt="캐릭터 이미지" 
        />
      </div>

      {/* 스탯 섹션 */}
      <div className="lostark-stats-section">
        <h3 className="lostark-stats-header">{CharacterName}</h3>
        <div className="lostark-stats-grid">
          <div className="lostark-stat-item">
            <span className="lostark-stat-label">클래스</span>
            <span className="lostark-stat-value">{CharacterClassName}</span>
          </div>
          <div className="lostark-stat-item">
            <span className="lostark-stat-label">원정대 레벨</span>
            <span className="lostark-stat-value">{ExpeditionLevel}</span>
          </div>
          <div className="lostark-stat-item">
            <span className="lostark-stat-label">아이템 레벨</span>
            <span className="lostark-stat-value">{ItemAvgLevel}</span>
          </div>
          <div className="lostark-stat-item">
            <span className="lostark-stat-label">전투력</span>
            <span className="lostark-stat-value">{CombatPower?.toLocaleString()}</span>
          </div>
          <div className="lostark-stat-item">
            <span className="lostark-stat-label">레벨</span>
            <span className="lostark-stat-value">{CharacterLevel}</span>
          </div>
          <div className="lostark-stat-item">
            <span className="lostark-stat-label">서버</span>
            <span className="lostark-stat-value">{ServerName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LostArkPage;