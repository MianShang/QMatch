import React from 'react';
import './specModal.css';

function SpecModal({ game, onClose }) {
  return (
    <div className="spec-modal-container">
    <button className="spec-close-button" onClick={onClose}>
        닫기
    </button>
      <h2>{game.gameName}</h2>
      <p>{game.gameCode}</p>

      {/* 여기에 전적 및 스펙 넣읍시다 */}
      <div className="spec-content-box">
        <p>여기에 상세 정보 기입 ㄱㄱ</p>
      </div>
    </div>
  );
}

export default SpecModal;
