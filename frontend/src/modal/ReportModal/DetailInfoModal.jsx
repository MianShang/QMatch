import React, { useState, useEffect} from 'react';
import { toast } from 'react-toastify'; 
import axios from 'axios';
import './DetailInfoModal.css';


function DetailInfoModal({ user, onClose}) {

    //유저가 등록한 계정 조회 
    const [adminGameData,setAdminGameData]=useState([]);

    //채팅 기록을 메모장으로 다운로드 
    const handleLogDownload = async (roomId, roomName) => {
        try {
            toast.info(`'${roomName}' 방의 로그를 다운로드합니다...`);

            //관리자용 채팅 로그 API를 호출
            const response = await axios.get(`/api/admin/chat-logs/${roomId}`, { withCredentials: true });
            const logs = response.data;

            if (!logs || logs.length === 0) {
                toast.warn("해당 방의 채팅 기록이 없습니다.");
                return;
            }

            //받아온 로그 데이터를 .txt 파일 형식의 문자열로 변환
            const logText = logs.map(log => `[${log.name}]: ${log.message}`).join('\n');

            //변환된 텍스트를 파일로 만들어 다운로드 실행
            const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chat-log-${roomName}-${roomId}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("채팅 로그 다운로드 실패:", error);
            toast.error("로그를 가져오는 중 오류가 발생했습니다.");
        }
    };

      // 프로필 데이터 로드
    useEffect(() => {
        if(!user?.userId){
            return;
        }
        axios.get("/api/get/user/gamecode", { params: { userId :user.userId} })
        .then((res) => setAdminGameData(res.data || []))
        .catch((err) => console.error("게임코드 불러오기 실패", err));
  }, [user]);

    if (!user) return null;
    
    return (
        <div className="detail-info-backdrop" onClick={onClose}>
            <div className="detail-info-content" onClick={e => e.stopPropagation()}>
                <div className="detail-info-header">
                    <h2>회원 상세 정보</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="detail-info-body">
                    <div className="info-section">
                        <h3>회원 ID</h3>
                        <p>{user.userId}</p>
                    </div>
                    <div className="info-section">
                        <h3>연결된 계정</h3>
                        <div>
                            {Array.isArray(adminGameData) && adminGameData.length > 0 ? (
                                adminGameData.map((item) => (
                                    <div key={item.id}>
                                        <span>{item.gameName}</span>
                                        <span>({item.gameCode})</span>
                                    </div>
                                ))
                            ) : (
                                <p>등록된 게임이 없습니다.</p>
                            )}
                        </div>
                    </div>
                    <div className="info-section">
                        <h3>참여중인 채팅방</h3>
                        <ul className="info-list clickable">
                         
                            {user.joinedChatRooms && user.joinedChatRooms.length > 0 ? (
                                user.joinedChatRooms.map(room => (
                                    <li key={room.roomId} onClick={() => handleLogDownload(room.roomId, room.roomName)}>
                                        {room.roomName} (ID: {room.roomId})
                                    </li>
                                ))
                            ) : (
                                <li>참여중인 채팅방이 없습니다.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DetailInfoModal;