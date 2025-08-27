import React, {useState}from "react";
import axios from 'axios';

function LostArkPage({lostarkStats})
{
    if (!lostarkStats) return null;

    return (
    <div style={{ color: "white" }}>
      <h2>Lost Ark 캐릭터 정보</h2>
      <p>캐릭터 닉네임 : {lostarkStats.CharacterName}</p>
      <p>클래스: {lostarkStats.CharacterClassName}</p>
      <p>원정대 레벨 : {lostarkStats.ExpeditionLevel}</p>
      <p>아이템 레벨 : {lostarkStats.ItemAvgLevel}</p>
      <p>전투력 : {lostarkStats.CombatPower}</p>
      <p>레벨: {lostarkStats.CharacterLevel}</p>
      <p>서버: {lostarkStats.ServerName}</p>
    </div>
  );
}

export default LostArkPage;