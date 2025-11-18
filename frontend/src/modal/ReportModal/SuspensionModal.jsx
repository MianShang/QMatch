import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '@axios';
import './SuspensionModal.css'; 

function SuspensionModal({ user, onClose, onConfirm }) {
    
    const [duration, setDuration] = useState('3');


    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(user.userId, duration);
        onClose(); 
    };

    return (
        <div className="suspension-modal-backdrop" onClick={onClose}>
            <div className="suspension-modal-content" onClick={e => e.stopPropagation()}>
                <div className="suspension-modal-header">
                    <h2>사용자 정지 기간 설정</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="suspension-modal-body">
                    <div className="form-group">
                        <label>정지될 유저</label>
                        <input type="text" value={user.userId} readOnly disabled />
                    </div>
                    <div className="form-group">
                        <label htmlFor="duration-select">정지 기간 선택</label>
                        <select id="duration-select" value={duration} onChange={e => setDuration(e.target.value)}>
                            <option value="3">3일</option>
                            <option value="7">7일</option>
                            <option value="14">14일</option>
                            <option value="30">30일</option>
                            <option value="365">365일 (1년)</option>
                            <option value="9999">영구정지</option>
                        </select>
                    </div>
                    <div className="suspension-modal-footer">
                        <button type="button" onClick={onClose} className="btn-cancel">취소</button>
                        <button type="submit" className="btn-submit">확인</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SuspensionModal;