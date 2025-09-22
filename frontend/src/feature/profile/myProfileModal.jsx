import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import InputModal from './components/inputModal.jsx';
import SpecModal from './components/specModal/specModal.jsx';
import axios from 'axios';
import './myProfileModal.css';
import { LogContext } from '../../App.jsx';
import { useLogout } from '../../hooks/login/useLogout.js';

function MyProfile({ viewUserId, onClose }) {
  const { userData, setUserData, setIsLogIn } = useContext(LogContext); // 내 로그인 정보
  const [profileData, setProfileData] = useState(null); // 모든 프로필 정보(소개, 상태메시지, 태그 등)
  const [showGameModal, setShowGameModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [gameData, setGameData] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [edit, setEdit] = useState(false);
  const [tempIntro, setTempIntro] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [editStatus, setEditStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState("");

  const isMe = viewUserId === userData?.userId; // 본인 여부
  const logoutFunc = useLogout(); // 로그아웃 함수

  
  const fetchProfileData = () => {
    return axios.get("/api/profile/user/info", { params: { userId: viewUserId } })
      .then((res) => {
        if (isMe) {
          setUserData(res.data); // Context도 업데이트
        }
        setProfileData(res.data);
      })
      .catch((err) => console.error("유저 프로필 불러오기 실패", err));
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
      .then((res) => {
        if (isMe) {
          setUserData(res.data); // 내 프로필이면 context 갱신
        }
        setProfileData(res.data);
      })
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
      .catch((err) => {
        console.error("게임 정보 저장 실패", err);
      });
  };

  // 유저 태그 저장
  const sendUserTag = (newTag) => {
    if (!isMe) return;
    axios.post("/api/profile/usertag", {
      userId: viewUserId,
      userTag: newTag
    })
    .then(() => {
    
      fetchProfileData();
    })
    .catch((err) => {
      console.error("태그 정보 저장 실패", err);
    });
  }

  // 프로필 데이터 로드
  useEffect(() => {
    if (!viewUserId) return;

    //fetchProfileData();


    if (isMe) {
      setProfileData(userData);
    } else {
      fetchProfileData();
    }

    
    axios.get("/api/get/user/gamecode", { params: { userId: viewUserId } })
      .then((res) => setGameData(res.data))
      .catch((err) => console.error("게임코드 불러오기 실패", err));



  }, [viewUserId, isMe, userData]);

  if (!profileData) return null; // 데이터 로딩 전

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-content-scrollable">
          {/* 상단 프로필 영역 */}
          <div className="profile-flex-box">
          <div className="left-box">
            {isMe ? (
              <>
                <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
                  <img
                    src={
                      profileData?.userProfile
                        ? `${profileData.userProfile}`
                        : 'https://placehold.co/250x250'
                    }
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
                src={
                  profileData?.userProfile
                    ? `${profileData.userProfile}`
                    : 'https://placehold.co/250x250'
                }
                alt="프로필"
              />
            )}
          </div>

          {/* 오른쪽 프로필 정보 */}
          <div className="right-box">
            <div className="profile-header-actions">
              <button className="close-btn" onClick={onClose}>
                <span>✕</span>
              </button>
              
              {isMe && (
                <button 
                  className="logout-btn" 
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  로그아웃
                </button>
              )}
            </div>

            <div className="profile-user-info">
              <h2 className="profile-username">{profileData?.userName}</h2>
              
              <div className="profile-status-section">
                {isMe && !editStatus && (
                  <button 
                    className="edit-status-btn"
                    onClick={() => { 
                      setTempStatus(profileData?.userStatusMessage || ''); 
                      setEditStatus(true); 
                    }}
                  >
                     상태 메시지 수정
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
                <h3 className="section-title">자주 사용하는 태그</h3>
                {isMe && (
                  <button className="add-tag-btn" onClick={() => setShowTagModal(true)}>
                    <span>+</span> 태그 추가
                  </button>
                )}
              </div>
              <div className="frequent-tags">
                {Array.isArray(profileData?.userTag) && profileData.userTag.length > 0 ? (
                  profileData.userTag.map((tag, index) => (
                    <span key={index} className="tag">#{tag}</span>
                  ))
                ) : (
                  <p className="no-tags">등록된 태그가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 게임 목록 */}
        <div className="profile-games-section">
          <div className="section-header">
            <h3 className="section-title">자주 하는 게임</h3>
            {isMe && (
              <button className="add-game-btn" onClick={() => setShowGameModal(true)}>
                <span>+</span> 게임 추가
              </button>
            )}
          </div>
          <div className="games-list">
            {Array.isArray(gameData) && gameData.length > 0 ? (
              gameData.map((item) => (
                <div
                  key={item.id}
                  className="game-item"
                  onClick={() => {
                    setSelectedGame(item);
                    setShowSpecModal(true);
                  }}
                >
                  <span className="game-name">{item.gameName}</span>
                  <span className="game-code">({item.gameCode})</span>
                </div>
              ))
            ) : (
              <p className="no-games">등록된 게임이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 자기소개 */}
        <div className="profile-bio-section">
          <div className="section-header">
            <h3 className="section-title">소개</h3>
            {isMe && (
              <button 
                className="edit-bio-btn"
                onClick={() => {
                  setTempIntro(profileData?.userIntro || '');
                  setEdit(true);
                }}
              >
                수정
              </button>
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
                  <button className="cancel-btn" onClick={() => setEdit(false)}>취소</button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* 오른쪽 전적 모달 패널 */}
      {selectedGame && showSpecModal && createPortal(
        <div className="spec-modal-overlay" onClick={() => {
          setShowSpecModal(false);
          setSelectedGame(null);
        }}>
          <div className="spec-modal-panel" onClick={(e) => e.stopPropagation()}>
            <SpecModal
              game={selectedGame}
              onClose={() => {
                setShowSpecModal(false);
                setSelectedGame(null);
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
          <div className="logout-confirm-overlay" onClick={() => setShowLogoutConfirm(false)}>
            <div className="logout-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>로그아웃 확인</h3>
              <p>정말 로그아웃 하시겠습니까?</p>
              <div className="logout-confirm-buttons">
                <button 
                  className="cancel-btn" 
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  취소
                </button>
                <button 
                  className="confirm-btn" 
                  onClick={() => {
                    logoutFunc(setIsLogIn);
                    onClose();
                  }}
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        )}

      {/* 입력 모달 */}
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