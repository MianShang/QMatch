import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './JoinRequestModal.css';

const JoinRequestModal = ({ open, onClose, roomId, ownerId, onRequestProcessed }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && roomId && ownerId) {
      fetchPendingRequests();
    }
  }, [open, roomId, ownerId]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/chat/rooms/${roomId}/pending-requests`, {
        params: { ownerId }
      });
      setPendingRequests(response.data.pendingRequests || []);
    } catch (error) {
      console.error('입장 신청 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicantId) => {
    try {
      await axios.post(`/api/chat/rooms/${roomId}/approve-join`, null, {
        params: { ownerId, applicantId }
      });
      
      // 목록에서 제거
      setPendingRequests(prev => prev.filter(req => req.userId !== applicantId));
      onRequestProcessed?.('approved', applicantId);
    } catch (error) {
      console.error('입장 승인 실패:', error);
      alert('입장 승인에 실패했습니다.');
    }
  };

  const handleReject = async (applicantId) => {
    try {
      await axios.post(`/api/chat/rooms/${roomId}/reject-join`, null, {
        params: { ownerId, applicantId }
      });
      
      // 목록에서 제거
      setPendingRequests(prev => prev.filter(req => req.userId !== applicantId));
      onRequestProcessed?.('rejected', applicantId);
    } catch (error) {
      console.error('입장 거절 실패:', error);
      alert('입장 거절에 실패했습니다.');
    }
  };

  if (!open) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="joinRequestModal" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>입장 신청 관리</h3>
          <button className="closeBtn" onClick={onClose}>✖</button>
        </div>

        <div className="modalContent">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="noRequests">대기 중인 입장 신청이 없습니다.</div>
          ) : (
            <div className="requestList">
              {pendingRequests.map((request) => (
                <div key={request.userId} className="requestItem">
                  <div className="userInfo">
                    <div className="userName">{request.userName}</div>
                    <div className="userId">ID: {request.userId}</div>
                  </div>
                  <div className="requestActions">
                    <button 
                      className="approveBtn"
                      onClick={() => handleApprove(request.userId)}
                    >
                      승인
                    </button>
                    <button 
                      className="rejectBtn"
                      onClick={() => handleReject(request.userId)}
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinRequestModal;
