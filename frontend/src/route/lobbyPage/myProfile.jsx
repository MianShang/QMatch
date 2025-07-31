import React, { useState, useEffect, useContext } from 'react';
import InputModal from './inputModal';
import axios from 'axios';
import './myProfile.css';
import { LogContext } from '../../App.jsx';

function MyProfile({ onClose }) {

  const { userData, setUserData } = useContext(LogContext);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [gameData, setGameData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [intro, setIntro] = useState("");
  const [tempIntro, setTempIntro] = useState("");

  //소개글 저장 
  const handleSave = async () => {
    try {
      await axios.post("/api/profile/intro", {
        userId: userData.userId,
        introText: tempIntro,
      },{
        headers : {
          "Content-Type":"application/json"
        }
      });
      setIntro(tempIntro);
      setEdit(false);
    } catch (err) {
      console.log("자기소개 post 실패", err);
    }
  };

  //이미지 업로드 
  const uploadProfileImage = (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("userId", userData.userId);
    formData.append("file", file);

    axios
      .post("/api/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        setUserData(res.data);
      })
      .catch((err) => console.error("업로드 실패:", err));
  };

  //게임 코드 저장 
  const sendUserGameCode = (gameName, gameCode) => {
    axios
      .post("/api/save/gamecode", {
        userId: userData.userId,
        gameName,
        gameCode,
      })
      .then(() =>
        axios.get("/api/get/user/gamecode", {
          params: { userId: userData.userId },
        })
      )
      .then((res) => {
        setGameData(res.data || []);
      })
      .catch((err) => {
        console.error("게임 정보 저장 실패:", err);
      });
  };

  // 자기소개 + 게임 목록 불러오기 
  useEffect(() => {
    if (!userData?.userId) return;

    // 소개글
    axios
      .get("/api/profile/intro", { params: { userId: userData.userId } })
      .then((res) => {
        setIntro(res.data.userIntro || "");
      })
      .catch((err) => console.error("소개글 불러오기 실패", err));

    // 게임 목록
    axios
      .get("/api/get/user/gamecode", {
        params: { userId: userData.userId },
      })
      .then((res) => {
        setGameData(res.data);
      })
      .catch((err) => console.error("게임코드 불러오기 실패", err));
  }, [userData]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="profile-flex-box">
          <div className="left-box">
            <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
              <img
                src={
                  userData?.userProfile
                    ? `http://localhost:8080${userData.userProfile}`
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
                  setSelectedFile(file);
                  uploadProfileImage(file);
                  e.target.value = '';
                }
              }}
            />
          </div>
          {/* 프로필 구역*/}
          <div className="right-box">
            <label onClick={onClose}>닫기</label>
            <h2>{userData?.userId}</h2>
            <p>작은 상태 메시지 구역 입니다.</p>

            <div className="tag-title">자주 사용하는 태그</div>
            <span className="add-text" onClick={() => setShowTagModal(true)}>
              + 태그 추가
            </span>
            <div className="frequent-tags">
              <span className="tag">#뉴비 환영</span>
              <span className="tag">#마이크 필수</span>
              <span className="tag">#빡겜</span>
              <span className="tag">#ㅎㅎ</span>
              <span className="tag">#ㅋㅇㄴㅁㅇ</span>
              <span className="tag">ㄻㄴㅇㅁ</span>
            </div>
          </div>
        </div>

        {/* 게임 목록 */}
        <div className="tag-box">
          <h3>자주 하는 게임</h3>
          <span className="add-text" onClick={() => setShowGameModal(true)}>
            + 게임 추가
          </span>
          <div className="tag-list">
            {Array.isArray(gameData) && gameData.length > 0 ? (
              gameData.map((item) => (
                <span key={item.id} className="tag">
                  {item.gameName} ({item.gameCode})
                </span>
              ))
            ) : (
              <p>등록된 게임이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 자기소개 */}
        <div className="bottom-box">
          <h3>내 소개</h3>
          <span
            onClick={() => {
              setTempIntro(intro);
              setEdit(true);
            }}
          >
            + 수정
          </span>
          {!edit && <p>{intro}</p>}
          {edit && (
            <>
              <textarea
                value={tempIntro}
                onChange={(e) => setTempIntro(e.target.value)}
                rows={3}
                readOnly={!edit}
                style={{ width: '100%' }}
              />
              <button onClick={handleSave}>저장</button>
            </>
          )}
        </div>
      </div>

      {showGameModal && (
        <InputModal
          type="game"
          onClose={() => setShowGameModal(false)}
          sendUserGameCode={sendUserGameCode}
        />
      )}
      {showTagModal && (
        <InputModal type="tag" onClose={() => setShowTagModal(false)} />
      )}
    </div>
  );
}

export default MyProfile;
