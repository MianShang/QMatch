
import React, { useState } from 'react';
import './Dnf.css';



function Dnf({dnfStats}){

    const { characterName, level, jobName, guildName, adventureFame} = dnfStats
    const imageUrl = `https://img-api.neople.co.kr/df/servers/${dnfStats.serverId}/characters/${dnfStats.characterId}?zoom=2`

    return(
        <>
        <div className='character-image'>
            <img src={imageUrl || "/placeholder.svg?height=100&width=100"}
            alt={`${characterName} 이미지`}
            ></img>
        </div>

        <div className='base-info'>
        <h2>{characterName}</h2>
        <p>레벨: {level}</p>
        <p>직업: {jobName}</p>
        <p>길드: {guildName || "없음"}</p>
        <p>모험가 명성: {adventureFame}</p>
        </div>
        </>
    )
}
export default Dnf
