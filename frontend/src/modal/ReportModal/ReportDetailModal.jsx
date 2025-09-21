import React from 'react';
import './ReportDetailModal.css'; 

function ReportDetailModal({ report, onClose }) {
    if (!report) return null;

    return (
        <div className="detail-modal-backdrop" onClick={onClose}    >
            <div className="detail-modal-content" onClick={e => e.stopPropagation()}>
                <div className="detail-modal-header">
                    <h2>신고 상세 내역 (신고 번호 : {report.id})</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="detail-modal-body">
                    <div className="detail-item">
                        <strong>신고자:</strong>
                        <span>{report.reporterId}</span>
                    </div>
                    <div className="detail-item">
                        <strong>피신고자:</strong>
                        <span>{report.reportedUserId}</span>
                    </div>
                    <div className="detail-item">
                        <strong>신고 시각:</strong>
                        <span>{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                        <strong>신고 사유:</strong>
                        <span>{report.reason}</span>
                    </div>
                    <div className="detail-item-details">
                        <strong>세부 내용:</strong>
                        <p>{report.details || '작성된 세부 내용이 없습니다.'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportDetailModal;