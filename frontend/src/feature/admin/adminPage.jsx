import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import './adminPage.css';


// 신고 상세내역 import
import ReportDetailModal from '../../modal/ReportModal/ReportDetailModal.jsx'
// 몇 일 정지 먹일래? import
import SuspensionModal from '../../modal/ReportModal/SuspensionModal.jsx'
// 상세 내용 임포트 
import DetailInfoModal from '../../modal/ReportModal/DetailInfoModal.jsx'


function AdminPage() {


    //현재 유저 및 신고 유저 상태  
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]); 

    //정지 날짜 모달 상태와 유저 상태
    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
    const [targetUser, setTargetUser] = useState(null);

    //나가기(뒤로가기)
    const navigate = useNavigate();

    //상세내역 모달 상태 추가
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    //회원들의 기록을 보관하는 모달창 
    const [isDetailInfoModalOpen, setIsDetailInfoModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);


    

    //상세내역 모달 열닫
    const handleOpenDetailModal = (report) => {
        setSelectedReport(report);
        setIsDetailModalOpen(true);
    };

    //정지 모달 열닫
    const handleOpenSuspendModal = (reportId, user) => {
        setTargetUser({ ...user, reportId });
        setIsSuspendModalOpen(true);
    };

    

    //토스트
    const confirmToast = (message, onConfirm) => {
        toast(
            <div className="confirm-toast-box">
                <p>{message}</p>
                <div className="confirm-toast-buttons">
                    <button className="confirm-btn confirm" onClick={() => { onConfirm(); toast.dismiss(); }}>
                        확인
                    </button>
                    <button className="confirm-btn cancel" onClick={() => toast.dismiss()}>
                        취소
                    </button>
                </div>
            </div>,
            { 
                autoClose: false, 
                closeOnClick: false,
                draggable: false,
                position: "top-center" 
            }
        );
    };

    //회원 상세정보 기록 모달 열닫
    const handleOpenDetailInfoModal = async (user) => {
        try {
            const response = await axios.get(`/api/admin/users/${user.userId}`, { withCredentials: true }); 
            setSelectedUser(response.data);
            setIsDetailInfoModalOpen(true);
        } catch (error) {
            console.error("회원 상세 정보 조회 실패:", error);
            toast.error("상세 정보를 불러오는 데 실패했습니다.");
        }
    };

    const fetchData = () => {
        axios.get('/api/admin/users', { withCredentials: true })
            .then(response => {
                setUsers(response.data);
            })
            .catch(error => {
                console.error("회원 목록을 불러오는 중 오류 발생:", error);
                toast.error("회원 목록을 불러올 수 없습니다.");
            });
        // 전체 신고 내역
        axios.get('/api/admin/reports', { withCredentials: true })
            .then(response => {
                setReports(response.data);
            })
            .catch(error => {
                console.error("신고 내역을 불러오는 중 오류 발생:", error);
                toast.error("신고 내역을 불러올 수 없습니다.");
            });
    };

    //정지 선택
    const suspendUserRequest = async (userId, duration) => {
        try {
            const response = await axios.post(
                `/api/admin/users/${userId}/suspend`,
                {
                    reportId: targetUser.reportId,
                    days: parseInt(duration)
                },
                { withCredentials: true }
            );
            toast.success(response.data);
            fetchData();
        } catch (error) {
            toast.error("임시 정지 처리 중 오류가 발생했습니다.");
        }
    };

    // 영구 정지
    const handleBan = (reportId, userId) => {
        confirmToast(`정말로 ${userId}님을 영구 정지하시겠습니까?`, async () => {
            try {
                const response = await axios.post(`/api/admin/users/${userId}/ban`, { reportId: reportId }, { withCredentials: true });
                toast.success(response.data);
                fetchData();
            } catch (error) {
                toast.error("영구 정지 처리 중 오류가 발생했습니다.");
            }
        });
    };
    // 다시 활성화
    const handleActivate = (userId) => {
        confirmToast(`${userId}님의 계정 정지를 해제하시겠습니까?`, async () => {
            try {
                const response = await axios.post(`/api/admin/users/${userId}/activate`, {}, { withCredentials: true });
                toast.success(response.data);
                fetchData();
            } catch (error) {
                toast.error("정지 해제 처리 중 오류가 발생했습니다.");
            }
        });
    };

    useEffect(() => {
        fetchData();
    }, []); 

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <h1>관리자 페이지</h1>
                <button  onClick={() => navigate(-1)} className="button-base button-secondary">
                    나가기
                </button>
            </div>

            {/* 회원 정보 표시 구역 */}
            <div className="section-container">
                <h2>회원 정보</h2>
                <div className="content-box">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>회원 ID</th>
                                <th>이름</th>
                                <th>이메일</th>
                                <th>계정 상태</th>
                                <th>관리</th>
                                <th>정지 해제</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.userId}>
                                    <td>{user.userId}</td>
                                    <td>{user.userName}</td>
                                    <td>{user.userEmail}</td>   
                                    <td>
                                        <span
                                            className={`status-badge ${
                                                user.status === '활성 상태' ? 'status-active' :
                                                user.status === '영구 정지' ? 'status-banned' :
                                                user.status.includes('정지') ? 'status-suspended' : ''
                                            }`}
                                            >
                                            {user.status}
                                        </span>
                                        </td> 
                                    <td><button className="button-base button-primary" onClick={() => handleOpenDetailInfoModal(user)}>상세보기</button></td>
                                    <td>
                                        {user.status !== '활성 상태' && (
                                            <button className = "button-base button-safe" onClick={() => handleActivate(user.userId)}>해제</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 신고 테이블 내용 구역 */}
            <div className="section-container">
                <h2>신고 내역</h2>
                <div className="content-box">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>신고 번호</th>
                                <th>신고자</th>
                                <th>피신고자</th>
                                <th>신고 사유</th>
                                <th>상세 보기</th>
                                <th>처리 상태</th>
                                <th>조치</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(report => (
                                <tr key={report.id}>
                                    <td>{report.id}</td>
                                    <td>{report.reporterId}</td>
                                    <td>{report.reportedUserId}</td>
                                    <td>{report.reason}</td>
                                    <td><button className="button-base button-primary"
                                    onClick={()=> handleOpenDetailModal(report)}>상세 보기</button></td>
                                    <td>{report.status}</td>
                                    <td>
                                    <button className="button-base button-danger" onClick={() => handleOpenSuspendModal(report.id, { userId: report.reportedUserId })}>임시정지</button> 
                                    <button className="button-base button-danger" onClick={() => handleBan(report.id, report.reportedUserId)} style={{backgroundColor: '#b22222'}}>영구정지</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            
            {isDetailModalOpen && selectedReport && (
                <ReportDetailModal
                    report={selectedReport}
                    onClose={() => setIsDetailModalOpen(false)}
                />
            )}

            {isSuspendModalOpen && (

                <SuspensionModal
                    user={targetUser}
                    onClose={() => setIsSuspendModalOpen(false)}
                    onConfirm={suspendUserRequest}
                />
            )}

            {isDetailInfoModalOpen && selectedUser && (
                <DetailInfoModal
                    user={selectedUser}
                    onClose={() => setIsDetailInfoModalOpen(false)}
                />
            )}

        </div>
    );
}

export default AdminPage;