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

  function getPotentialClass(grade) {
    if (!grade) return "";
    const g = grade.toLowerCase();
    if (grade.includes("레전드리") || g.includes("legendary")) return "potential-legendary";
    if (grade.includes("유니크")   || g.includes("unique"))    return "potential-unique";
    if (grade.includes("에픽")     || g.includes("epic"))      return "potential-epic";
    if (grade.includes("레어")     || g.includes("rare"))      return "potential-rare";
    return "";
  }

  function getGradeRank(grade) {
    if (!grade) return 999;
    const g = grade.toLowerCase();
    if (grade.includes("레전드리") || g.includes("legendary")) return 1;
    if (grade.includes("유니크")   || g.includes("unique"))    return 2;
    if (grade.includes("에픽")     || g.includes("epic"))      return 3;
    if (grade.includes("레어")     || g.includes("rare"))      return 4;
    return 999;
  }

  function getHighestGradeClass(potentialGrade, additionalPotentialGrade) {
    const rank1 = getGradeRank(potentialGrade);
    const rank2 = getGradeRank(additionalPotentialGrade);
    return rank1 <= rank2 ? getPotentialClass(potentialGrade) : getPotentialClass(additionalPotentialGrade);
  }

  function formatCombatPower(value) {
    if (!value) return "N/A";
    const num = parseInt(value, 10);
    if (isNaN(num)) return value;

    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    const rest = num % 10000;

    let result = "";
    if (eok > 0) result += `${eok}억 `;
    if (man > 0) result += `${man}만 `;
    if (rest > 0 || result === "") result += rest;

    return result.trim();
  }

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
      <p className="stat-line">
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

  function renderPotential(options) {
    if (!options || options.length === 0) return null;
    return options.map((opt, i) => (
      <p key={i} className="potential-line">{opt}</p>
    ));
  }

  return (
    <div className="maple-box">
      {/* 좌측 캐릭터 */}
      <div className="maple-left">
        <div className="maple-image">
          <img src={imageUrl} alt="캐릭터" />
        </div>
        <div className="maple-info">
          <h2>{characterName}</h2>
          <p className="server">서버: {worldName}</p>
          <p className="level">레벨: {level}</p>
          <p className="job">직업: {job}</p>
          <p className="guild">길드: {guildName || "없음"}</p>
          <p className="combat">전투력: {formatCombatPower(combatPower)}</p>
        </div>
      </div>

      {/* 우측 장비 */}
      <div className="maple-equipment-section">
        <h3>장착 장비 목록</h3>
        <div className="maple-equipment-list">
          {equipment && equipment.length > 0 ? (
            equipment.map((item, idx) => (
              <div key={idx} className="maple-equipment-item">
                <img src={item.iconUrl} alt={item.name} data-tooltip-id={`equip-${idx}`} />

                <p className={getHighestGradeClass(item.potentialGrade, item.additionalPotentialGrade)}>
                  {item.name}
                </p>

                <p className="equip-type">장비분류: {item.type}</p>

                <Tooltip id={`equip-${idx}`} place="right" className="customTooltip">
                  <div className="tooltip-content">
                    {renderStars(item.starforce)}

                    {/* 소울 프리픽스 (상단) - '소울 적용' 제거 */}
                    {item.soulName && (
                      <p className="soul-prefix">
                        {item.soulName.replace(" 소울 적용", "")}
                      </p>
                    )}

                    {/* 아이템 이름 */}
                    <strong className={getHighestGradeClass(item.potentialGrade, item.additionalPotentialGrade)}>
                      {item.name} {item.scrollUpgrade ? `(+${item.scrollUpgrade})` : ""}
                    </strong>

                    {/* 장비 분류 */}
                    <p className="tooltip-type">장비분류: {item.type}</p>

                    {/* 옵션 */}
                    <div className="tooltip-options">
                      {item.optionDetails?.map((opt, i) => (
                        <React.Fragment key={i}>{renderStatLine(opt)}</React.Fragment>
                      ))}
                      {item.ignoreMonsterArmor && parseInt(item.ignoreMonsterArmor) > 0 && (
                        <p>몬스터 방어율 무시: {item.ignoreMonsterArmor}%</p>
                      )}
                      {item.bossDamage && parseInt(item.bossDamage) > 0 && (
                        <p>보스 공격 시 데미지: {item.bossDamage}%</p>
                      )}
                    </div>

                    {/* 잠재옵션 */}
                    {item.potential?.length > 0 && (
                      <>
                        <hr />
                       <p className={`section-title ${getPotentialClass(item.potentialGrade)}`}>
                          잠재옵션
                        </p>
                        {renderPotential(item.potential)}
                      </>
                    )}

                    {/* 에디셔널 잠재옵션 */}
                    {item.additionalPotential?.length > 0 && (
                      <>
                        <hr />
                        <p className={`section-title ${getPotentialClass(item.additionalPotentialGrade)}`}>
                          에디셔널 잠재옵션
                        </p>
                        {renderPotential(item.additionalPotential)}
                      </>
                    )}

                    {/* 소울 적용 문구 */}
                    {item.soulOption && (
                      <>
                        <hr />
                        <p className= "section-title soul-apply">
                          {item.soulName}
                        </p>
                        <p className="soul-option">{item.soulOption}</p>
                      </>
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
