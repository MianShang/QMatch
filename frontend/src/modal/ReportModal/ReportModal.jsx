import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ReportModal.css'; // 모달 전용 CSS 파일

function ReportModal({ onClose, reporterId, reportedUserId }) {
    const [reason, setReason] = useState(''); // 신고 사유 (선택)
    const [details, setDetails] = useState(''); // 세부 내용
    const [file, setFile] = useState(null);   // 첨부 파일

    const handleSubmit = async (e) => {
        e.preventDefault(); // form의 기본 제출 동작 방지

        if (!reason) {
            toast.error('신고 사유를 선택해주세요.');
            return;
        }

        // FormData는 파일과 텍스트를 함께 보낼 때 사용합니다.
        const formData = new FormData();
        formData.append('reporterId', reporterId);
        formData.append('reportedUserId', reportedUserId);
        formData.append('reason', reason);
        formData.append('details', details);
        if (file) {
            formData.append('file', file);
        }

        try {
            
            await axios.post('/api/reports', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
            });

            // console.log({
            //     reporterId,
            //     reportedUserId,
            //     reason,
            //     details,
            //     file
            // });

            toast.success('신고가 성공적으로 접수되었습니다.');
            onClose(); 
        } catch (error) {
            console.error('신고 제출 중 오류 발생:', error);
            toast.error('신고 접수 중 문제가 발생했습니다.');
        }
    };

    return createPortal(
        <div className="report-modal-backdrop" onClick={onClose}>
            <div className="report-modal-content" onClick={e => e.stopPropagation()}>
                <div className="report-modal-header">
                    <h2>사용자 신고</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="report-modal-body">
                    <div className="form-group">
                        <label>신고할 유저</label>
                        <input type="text" value={reportedUserId} readOnly disabled />
                    </div>
                    <div className="form-group">
                        <label htmlFor="reason">신고 내용 선택</label>
                        <select id="reason" value={reason} onChange={e => setReason(e.target.value)} required>
                            <option value="">선택하세요.</option>
                            <option value="욕설_및_비방">욕설 및 비방</option>
                            <option value="스팸_및_광고">스팸 및 광고</option>
                            <option value="허위_계정_등록">허위 계정 등록</option>
                            <option value="비매너_행위">비매너 행위</option>
                            <option value="기타">기타</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="details">세부 신고 내용</label>
                        <textarea id="details" value={details} onChange={e => setDetails(e.target.value)} rows="5" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="file">첨부파일 (선택사항)</label>
                        <input type="file" id="file" onChange={e => setFile(e.target.files[0])} />
                    </div>
                    <div className="report-modal-footer">
                        <button type="button" onClick={onClose} className="btn-cancel">취소</button>
                        <button type="submit" className="btn-submit">신고하기</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default ReportModal;