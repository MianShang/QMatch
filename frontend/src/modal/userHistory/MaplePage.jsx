import React from "react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import "./MaplePage.css";


function MaplePage({ mapleStats }) {
  if (!mapleStats) {
    return <p style={{ color: "#aaa" }}>메이플 정보가 없습니다.</p>;
  }

  const { characterName, worldName, level, job, guildName, imageUrl, equipment } = mapleStats;

  return (
    <div className="maple-box">
      <p className="maple-server-info">{worldName} - {characterName}</p>

      {/* 상단 캐릭터 정보 */}
      <div className="maple-top-row">
        <div className="maple-image">
          <img src={imageUrl} alt="캐릭터" />
        </div>
        <div className="maple-info">
          <h2>{characterName}</h2>
          <p>레벨: {level}</p>
          <p>직업: {job}</p>
          <p>길드: {guildName || "없음"}</p>
        </div>
      </div>

      {/* 장비 목록 */}
      <div className="maple-equipment-section">
        <h3>장착 장비 목록</h3>
        <div className="maple-equipment-list">
          {equipment && equipment.length > 0 ? (
            equipment.map((item, idx) => (
              <div key={idx} className="maple-equipment-item">
                <img
                  src={item.iconUrl}
                  alt={item.name}
                  data-tooltip-id={`equip-${idx}`}
                />
                <div>
                  <p>{item.name} (+{item.starforce})</p>
                  <p>부위: {item.type}</p>
                </div>

                <Tooltip id={`equip-${idx}`} place="right" className="customTooltip">
                  <div>
                    <strong>{item.name} (+{item.starforce})</strong>
                    <p>부위: {item.type}</p>
                    <hr />
                    <p><strong>잠재옵션</strong></p>
                    {item.potential?.length > 0 ? (
                      item.potential.map((opt, i) => <p key={i}>{opt}</p>)
                    ) : (
                      <p>없음</p>
                    )}
                    <p><strong>에디셔널 잠재옵션</strong></p>
                    {item.additionalPotential?.length > 0 ? (
                      item.additionalPotential.map((opt, i) => <p key={i}>{opt}</p>)
                    ) : (
                      <p>없음</p>
                    )}
                  </div>
                </Tooltip>
              </div>
            ))
          ) : (
            <p>장비 정보 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MaplePage;
