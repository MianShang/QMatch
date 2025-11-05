import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { LogContext } from '../../App.jsx';
import { useLogout } from '../../hooks/login/useLogout.js';
import InputModal from './components/inputModal.jsx';
import SpecModal from '../../modal/userHistory/UserHistoryModal.jsx';
import { toast } from 'react-toastify';
import './myProfileModal.css';

function MyProfile({ viewUserId, onClose }) {
  // --- 상태 변수 (States) ---
  const { userData, setUserData, setIsLogIn } = useContext(LogContext); // 전역 로그인 정보
  
  const [profileData, setProfileData] = useState(null);       // 현재 프로필 유저의 전체 정보
  const [gameData, setGameData] = useState([]);               // 등록된 게임 목록
  
  const [showGameModal, setShowGameModal] = useState(false);       // 게임 추가 모달 표시 여부
  const [showTagModal, setShowTagModal] = useState(false);         // 태그 추가 모달 표시 여부
  const [showSpecModal, setShowSpecModal] = useState(false);       // 전적 검색 모달 표시 여부

  const [editNickName, setEditNickName] = useState(false);    // 닉네임 수정 모드 여부
  const [edit, setEdit] = useState(false);                    // 자기소개 수정 모드 여부
  const [editStatus, setEditStatus] = useState(false);        // 상태 메시지 수정 모드 여부

  const [tempNickName, setTempNickName] = useState("");       // 임시 닉네임 저장
  const [tempIntro, setTempIntro] = useState("");             // 임시 자기소개 저장
  const [tempStatus, setTempStatus] = useState("");           // 임시 상태 메시지 저장
  
  const [selectedGame, setSelectedGame] = useState(null);     // 전적 검색 시 선택된 게임 정보
  const isMe = viewUserId === userData?.userId;               // 본인 프로필 여부 확인
  const logoutFunc = useLogout();                             // 커스텀 로그아웃 함수

  // --- 기능 함수들 (Functions) ---

  // 프로필 정보(닉네임, 소개, 상태 등) 불러오기
  const fetchProfileData = () => {
    return axios.get("/api/profile/user/info", { params: { userId: viewUserId } })
      .then((res) => {
        if (isMe) {

        setUserData(prevUserData => {
          //res에서 dataauthorities를 분리하고,
          //나머지 모든 데이터를 profileInfo 라는 새 객체에 담아서 관리자 권한 유지
          const { authorities, ...profileInfo } = res.data;

          //기존 userData(...prevUserData) 위에 관리자 권한을 덮어씌움
          return {
            ...prevUserData,
            ...profileInfo
          };
        });
      }
        setProfileData(res.data);
      })
      .catch((err) => console.error("유저 프로필 불러오기 실패", err));
  };

  // 닉네임 저장
  const sendUserNickName = async () => {
    if (!isMe) return;
    try {
      await axios.post("/api/profile/usernickname", {
        userId: viewUserId,
        nickName: tempNickName,
      });
      await fetchProfileData();
      setEditNickName(false);
    } catch (err) {
      console.log("닉네임 저장 실패", err);
    }
  };

  // 소개글 저장
  const handleSave = async () => {
    if (!isMe) return;
    try {
      await axios.post("/api/profile/intro", {
        userId: viewUserId,
        introText: tempIntro,
      });
      await fetchProfileData();
      setEdit(false);
    } catch (err) {
      console.log("자기소개 저장 실패", err);
    }
  };

  // 상태 메시지 저장
  const handleStatusSave = async () => {
    if (!isMe) return;
    try {
      await axios.post("/api/profile/status", {
        userId: viewUserId,
        statusMessage: tempStatus,
      });
      await fetchProfileData();
      setEditStatus(false);
    } catch (err) {
      console.log("상태메시지 저장 실패", err);
    }
  };

  // 프로필 이미지 업로드
  const uploadProfileImage = (file) => {
    if (!isMe || !file) return;
    const formData = new FormData();
    formData.append("userId", viewUserId);
    formData.append("file", file);

    axios.post("/api/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then(() => fetchProfileData())
      .catch((err) => console.error("업로드 실패:", err));
  };

  // 게임 코드 저장
  const sendUserGameCode = (gameName, gameCode) => {
    if (!isMe) return;
    axios.post("/api/save/gamecode", {
      userId: viewUserId,
      gameName,
      gameCode,
    })
      .then(() => axios.get("/api/get/user/gamecode", { params: { userId: viewUserId } }))
      .then((res) => {
        setGameData(res.data || []);
      })
      .catch((err) => console.error("게임 정보 저장 실패", err));
  };

  // 게임 코드 삭제
  const handleDeleteGameCode = (gameCode) => {
    if (!isMe) return;
    axios.delete(`/api/delete/gamecode/${gameCode}`)
      .then(response => {
        console.log(response.data); 
        setGameData(prevGameData =>
          prevGameData.filter(item => item.id !== gameCode)
        );
      })
      .catch(error => console.error("게임 정보 삭제 실패", error));
  };

    
    const fetchGameData = () => {
      return axios.get("/api/get/user/gamecode", { params: { userId: viewUserId } })
        .then((res) => {
          console.log("서버에서 받은 게임 데이터:", res.data);
          setGameData(res.data || []);
        })
        .catch((err) => console.error("게임 목록 불러오기 실패", err));
    };
  
    //대표 계정 설정
    const handleSetMainAccount = async (gameCodeId) => {
      if (!isMe) return;
      try {
        await axios.put(`/api/user-game-codes/${gameCodeId}/set-main`, {}, { withCredentials: true });
        toast.success('대표 계정이 설정되었습니다.');
        fetchGameData(); 
      } catch (err) {
        console.error("대표 계정 설정 실패:", err);
        toast.error('대표 계정 설정에 실패했습니다.');
      }
    };

  // 유저 태그 저장
  const sendUserTag = (newTag) => {
    if (!isMe) return;
    axios.post("/api/profile/usertag", {
      userId: viewUserId,
      userTag: newTag
    })
      .then(() => fetchProfileData())
      .catch((err) => console.error("태그 정보 저장 실패", err));
  }

  // --- 데이터 로딩 (Effects) ---

  // 컴포넌트 마운트 시 프로필 데이터와 게임 목록 로드
  useEffect(() => {
    if (!viewUserId) return;

    fetchProfileData();
    fetchGameData();

  }, [viewUserId]);

  

  // --- 렌더링 (Rendering) ---

  if (!profileData) return null; // 데이터 로딩 중에는 아무것도 표시하지 않음

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content-scrollable">

          {/* 상단 프로필 영역 */}
          <div className="profile-flex-box">
            <div className="left-box">
              {isMe ? (
                <>
                  <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
                    <img
                      src={profileData?.userProfile ? `${profileData.userProfile}` : 'https://placehold.co/250x250'}
                      alt="프로필"
                    />
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        uploadProfileImage(file);
                        e.target.value = '';
                      }
                    }}
                  />
                </>
              ) : (
                <img
                  src={profileData?.userProfile ? `${profileData.userProfile}` : 'https://placehold.co/250x250'}
                  alt="프로필"
                />
              )}
            </div>
            <div className="right-box">
              <div className="profile-header-actions">
                {isMe && (
                  <button className="logout-btn" onClick={() => logoutFunc(setIsLogIn)}>로그아웃</button>
                )}
              </div>
              <div className="profile-user-info">
                {!editNickName ? (
                  <div className="nickname-section">
                    <h2 className={`profile-nickname ${isMe ? 'editable' : ''}`}
                    onClick={() => { if (!isMe) return; 
                      setTempNickName(profileData?.userNickName || '');
                      setEditNickName(true);
                    }}>{profileData?.userNickName || profileData?.userId}</h2>
                  </div>
                ) : (
                  <div className="nickname-edit-form">
                    <input
                      type="text"
                      className="nickname-input"
                      value={tempNickName}
                      onChange={(e) => setTempNickName(e.target.value)}
                      placeholder="사용할 닉네임을 입력하세요"
                    />
                    <div className="nickname-edit-actions">
                      <button className="save-btn" onClick={sendUserNickName}>저장</button>
                      <button className="cancel-btn" onClick={() => setEditNickName(false)}>취소</button>
                    </div>
                  </div>
                )}
                <div className="profile-status-section">
                  {isMe && !editStatus && (
                    <button className="edit-status-btn" onClick={() => {
                      setTempStatus(profileData?.userStatusMessage || '');
                      setEditStatus(true);
                    }}>
                      ✏️
                    </button>
                  )}
                  {!editStatus && (
                    <p className="status-message">
                      {profileData?.userStatusMessage || "상태 메시지가 없습니다."}
                    </p>
                  )}
                  {editStatus && isMe && (
                    <div className="status-edit-form">
                      <textarea
                        className="status-textarea"
                        value={tempStatus}
                        onChange={(e) => setTempStatus(e.target.value)}
                        rows={3}
                        placeholder="상태 메시지를 입력하세요..."
                      />
                      <div className="status-edit-actions">
                        <button className="save-btn" onClick={handleStatusSave}>저장</button>
                        <button className="cancel-btn" onClick={() => setEditStatus(false)}>취소</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="profile-tags-section">
                <div className="section-header">
                  <h3 className="section-title">나만의 태그</h3>
                  {isMe && (
                    <span className="add-tag-btn" onClick={() => setShowTagModal(true)}>
                    ✏️
                    </span>
                  )}
                </div>
                <div className="frequent-tags">
                  {Array.isArray(profileData?.userTags) && profileData.userTags.length > 0 ? (
                    profileData.userTags.map((tag, index) => (
                      <span key={index} className="tag">#{tag}</span>
                    ))
                  ) : (
                    <p className="no-tags">등록된 해시 태그가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-games-section">
            <div className="section-header">
              <h3 className="section-title">자주 하는 게임</h3>
              {isMe && (
                <span className="add-game-btn" onClick={() => setShowGameModal(true)}>
                  🕹️
                </span>
              )}
            </div>
            <div className="games-list">
              {Array.isArray(gameData) && gameData.length > 0 ? (
                gameData.map((item) => (
                  <div key={item.id} className="game-item-container">
                    <div
                      className="game-item"
                      onClick={() => {
                        setSelectedGame(item);
                        setShowSpecModal(true);
                      }}
                    >
                      
                      {item.main && <span className="main-account-badge" title="대표 계정">👑</span>}
                      <span className="game-name">{item.gameName}</span>
                      <span className="game-code">({item.gameCode})</span>
                    </div>

                    {isMe && (
                      <div className="game-item-actions">
                       
                        {!item.main && (
                          <button
                            className="set-main-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetMainAccount(item.id);
                            }}
                          >
                            대표 설정
                          </button>
                        )}
                        <button
                          className="delete-game-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGameCode(item.id);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-games">등록된 게임이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 자기소개 영역 */}
          <div className="profile-bio-section">
            <div className="section-header">
              <h3 className="section-title">소개</h3>
              {isMe && (
                <span
                  className="edit-bio-btn"
                  onClick={() => {
                    setTempIntro(profileData?.userIntro || '');
                    setEdit(true);
                  }}
                >
                  ✏️
                </span>
              )}
            </div>
            <div className="bio-content">
              {!edit && (
                <p className="bio-text">
                  {profileData?.userIntro || "자기소개가 없습니다."}
                </p>
              )}
              {edit && isMe && (
                <div className="bio-edit-form">
                  <textarea
                    className="bio-textarea"
                    value={tempIntro}
                    onChange={(e) => setTempIntro(e.target.value)}
                    rows={4}
                    placeholder="자기소개를 입력하세요..."
                  />
                  <div className="bio-edit-actions">
                    <button className="save-btn" onClick={handleSave}>저장</button>
                    <button className="cancel-btn" onClick={(e) => { e.stopPropagation(); setEdit(false); }}>취소</button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 모달 영역 (포탈) */}
      {selectedGame && showSpecModal && createPortal(
        <div className="spec-modal-overlay" onClick={() => {
          setShowSpecModal(false);
          setSelectedGame(null);
        }}>
          <div className="spec-modal-panel" onClick={(e) => e.stopPropagation()}>
            <SpecModal
              setUserHistoryOpen={() => {
                setShowSpecModal(false);
                setSelectedGame(null);
              }}
              historyUserId={viewUserId}
              sendToModalGameName={selectedGame?.gameName}
              sendToModalGameCode={selectedGame?.gameCode}
            />
          </div>
        </div>,
        document.body
      )}
      
      {showGameModal && (
        <InputModal
          type="game"
          onClose={() => setShowGameModal(false)}
          sendUserGameCode={sendUserGameCode}
        />
      )}

      {showTagModal && (
        <InputModal type="tag" onClose={() => setShowTagModal(false)} sendUserTag={sendUserTag} />
      )}
    </div>
  );
}

export default MyProfile;
