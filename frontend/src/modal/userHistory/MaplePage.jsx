import React from "react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import "./MaplePage.css";

function MaplePage({ mapleStats }) {
  if (!mapleStats) {
    return <p style={{ color: "#aaa" }}>메이플 정보가 없습니다.</p>;
  }

  const { characterName, worldName, level, job, guildName, imageUrl, equipment, combatPower } = mapleStats;

  const statColors = {
    total: "#00FFFF",
    base: "#FFFFFF",
    add: "#00FF00",
    enchant: "#AAAAAA",
    starforce: "#FFD700"
  };

  // 등급별 색상 클래스 매핑
  function getPotentialClass(grade) {
    if (!grade) return "";
    const g = grade.toLowerCase();
    if (grade.includes("레전드리") || g.includes("legendary")) return "potential-legendary";
    if (grade.includes("유니크")   || g.includes("unique"))    return "potential-unique";
    if (grade.includes("에픽")     || g.includes("epic"))      return "potential-epic";
    if (grade.includes("레어")     || g.includes("rare"))      return "potential-rare";
    return "";
  }

  // 전투력 포맷 (억/만 단위)
  function formatCombatPower(value) {
    if (!value) return "N/A";
    const num = parseInt(value, 10);
    if (isNaN(num)) return value;

    const eok = Math.floor(num / 100000000);             // 억 단위
    const man = Math.floor((num % 100000000) / 10000);   // 만 단위
    const rest = num % 10000;                            // 나머지

    let result = "";
    if (eok > 0) result += `${eok}억 `;
    if (man > 0) result += `${man}만 `;
    if (rest > 0 || result === "") result += rest;

    return result.trim();
  }

  // 별 (줄마다 15개, 5개씩 묶고 그룹 간 간격은 CSS로)
  function renderStars(count) {
    if (!count || count <= 0) return null;

    const GROUP_SIZE = 5;
    const ROW_GROUPS = 3;

    const groups = [];
    const fullGroups = Math.floor(count / GROUP_SIZE);
    const remainder  = count % GROUP_SIZE;
    for (let i = 0; i < fullGroups; i++) groups.push("★".repeat(GROUP_SIZE));
    if (remainder) groups.push("★".repeat(remainder));

    const rows = [];
    for (let i = 0; i < groups.length; i += ROW_GROUPS) {
      rows.push(groups.slice(i, i + ROW_GROUPS));
    }

    return (
      <div className="stars">
        {rows.map((row, rIdx) => (
          <div className="star-row" key={rIdx}>
            {row.map((g, cIdx) => (
              <span className="star-group" key={cIdx}>{g}</span>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // 스탯 라인
  function renderStatLine(opt) {
    const total = (opt.base || 0) + (opt.add || 0) + (opt.enchant || 0) + (opt.starforce || 0);
    if (total === 0) return null;

    const formatValue = (val, color) =>
      val !== 0 ? (
        <span style={{ color }}>
          {opt.statName === "올스탯" ? `+${val}%` : `+${val}`}
        </span>
      ) : null;

    return (
      <p>
        <span style={{ color: statColors.total }}>
          {opt.statName}: {opt.statName === "올스탯" ? `+${total}%` : `+${total}`}
        </span>{" "}
        (
        {formatValue(opt.base, statColors.base)}
        {formatValue(opt.add, statColors.add)}
        {formatValue(opt.enchant, statColors.enchant)}
        {formatValue(opt.starforce, statColors.starforce)}
        )
      </p>
    );
  }

  // 잠재옵션 렌더링 (옵션은 항상 흰색)
  function renderPotential(options) {
    if (!options || options.length === 0) return null;
    return options.map((opt, i) => (
      <p key={i} style={{ color: "#FFFFFF" }}>{opt}</p>
    ));
  }

  return (
    <div className="maple-box">
      <p className="maple-server-info">{worldName} - {characterName}</p>
      <div className="maple-top-row">
        <div className="maple-image">
          <img src={imageUrl} alt="캐릭터" />
        </div>
        <div className="maple-info">
          <h2>{characterName}</h2>
          <p>레벨: {level}</p>
          <p>직업: {job}</p>
          <p>길드: {guildName || "없음"}</p>
          <p>전투력: {formatCombatPower(combatPower)}</p>
        </div>
      </div>

      <div className="maple-equipment-section">
        <h3>장착 장비 목록</h3>
        <div className="maple-equipment-list">
          {equipment && equipment.length > 0 ? (
            equipment.map((item, idx) => {          
              return (
                <div key={idx} className="maple-equipment-item">
                  <img src={item.iconUrl} alt={item.name} data-tooltip-id={`equip-${idx}`} />
                  <div>
                    <p>{item.name}</p>
                    <p>장비분류: {item.type}</p>
                  </div>

                  <Tooltip id={`equip-${idx}`} place="right" className="customTooltip">
                    <div>
                      {renderStars(item.starforce)}

                      <strong style={{ color: "#FFFFFF" }}>
                        {item.name} {item.scrollUpgrade ? `(+${item.scrollUpgrade})` : ""}
                      </strong>

                      <p style={{ color: "#aaa", marginBottom: "6px" }}>
                        장비분류: {item.type}
                      </p>

                      {item.optionDetails?.map((opt, i) => (
                        <React.Fragment key={i}>{renderStatLine(opt)}</React.Fragment>
                      ))}

                      {item.ignoreMonsterArmor && parseInt(item.ignoreMonsterArmor) > 0 && (
                        <p style={{ color: "#FFFFFF" }}>
                          몬스터 방어율 무시: {item.ignoreMonsterArmor}%
                        </p>
                      )}

                      {item.bossDamage && parseInt(item.bossDamage) > 0 && (
                        <p style={{ color: "#FFFFFF" }}>
                          보스 공격 시 데미지: {item.bossDamage}%
                        </p>
                      )}

                      {item.potential?.length > 0 && (
                        <>
                          <hr />
                          <p>
                            <strong className={getPotentialClass(item.potentialGrade)}>
                              잠재옵션
                            </strong>
                          </p>
                          {renderPotential(item.potential)}
                        </>
                      )}

                      {item.additionalPotential?.length > 0 && (
                        <>
                          <hr />
                          <p>
                            <strong className={getPotentialClass(item.additionalPotentialGrade)}>
                              에디셔널 잠재옵션
                            </strong>
                          </p>
                          {renderPotential(item.additionalPotential)}
                        </>
                      )}
                    </div>
                  </Tooltip>
                </div>
              );
            })
          ) : (
            <p>장비 정보 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MaplePage;
