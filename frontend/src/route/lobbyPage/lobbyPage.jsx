import { useRef, useState, useEffect, useContext, memo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import './lobbyPage.css'

// 컴포넌트 import
import ChatListPage from './lobbyPageRoute/chatListPage.jsx';
import FriendListPage from './lobbyPageRoute/friendListPage.jsx';
import MyProfile from '../../feature/profile/myProfileModal.jsx';

// 로그인 체크용 Context API import
import { LogContext } from '../../App.jsx'

// Custom hook import
import { useChatSubscriber } from '../../hooks/chat/useChatSubscriber.js'
import { useChatSender } from '../../hooks/chat/useChatSender.js'
import { useLoginCheck } from '../../hooks/login/useLoginCheck.js';
import { useLogout } from '../../hooks/login/useLogout.js';

function LobbyPage() {

  //프로필 모달 상태
  const [showProfileModal, setShowProfileModal] = useState(false);

  //사이드바 확장 상태 (중앙 div 표시 여부)
  const [showMidBar, setShowMidBar] = useState(true);

  //채팅/친구 토글
  const [toggle, setToggle] = useState(true);

  //채팅 관련 state
  const [selectedRoom, setSelectedRoom] = useState();
  const [messages, setMessages] = useState([]);
  const [client, setClient] = useState(null);
  const [input, setInput] = useState('');

  //Context
  const { isLogIn, setIsLogIn, userData, setUserData } = useContext(LogContext);

  //프로필 유저 구분
  const [profileUserId, setProfileUserId] = useState(null);
  


  //로그인 체크 & 채팅방 구독
  useLoginCheck(isLogIn);
  useChatSubscriber(selectedRoom, setMessages, setClient, userData);

  //로그아웃 / 메시지 전송 훅
  const logoutFunc = useLogout();
  const sendMessage = useChatSender(client, selectedRoom, userData, input, setInput);

  //스크롤 자동 하단 이동
  const messageContainerRef = useRef(null);
  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  //프로필 정보 DB에서 불러오기
  useEffect(() => {
    if (!userData?.userId) return;
    axios.get("/api/profile/user/info", { params: { userId: userData.userId } })
      .then(res => setUserData(res.data))
      .catch(err => console.error("유저 정보 불러오기 실패:", err));
  }, [userData?.userId, setUserData]);


  return (
    <>
      <div className='fullscreen' style={{ display: "flex", padding: "10px" }}>
        {/*사이드바 */}
        <div className={`contentStyle ${showMidBar ? 'sideBarSize' : 'sideBarExpanded'}`}>
          {/*프로필 이미지 클릭 → 바로 모달 열림 */}
          <img
            src={userData?.userProfile ? `${userData.userProfile}` : "https://placehold.co/250x250"} style={{width: '80px', height : '80px', objectFit: 'cover'}}
            onClick={() => {setProfileUserId(userData?.userId)
                            setShowProfileModal(true)}}
            className={`${showMidBar ? 'sideBarImgSize' : 'sideBarImgSizeExpanded'}`}
          />
          <p onClick={() => logoutFunc(setIsLogIn)} style={{ cursor: 'pointer', marginTop: '10px' }}>로그아웃</p>
        </div>

        {/*중앙 채팅/친구 영역 */}
        {showMidBar &&
          <div className='midBarSize'>
            {/* 채팅/친구 토글 */}
            <div style={{ display: "flex" }}>
              <div onClick={() => setToggle(true)}
                className={`toggleSwitchText contentStyle toggleSwitch ${toggle ? 'activeBorder' : ''}`}>
                채팅
              </div>
              <div onClick={() => setToggle(false)}
                className={`toggleSwitchText contentStyle toggleSwitch ${!toggle ? 'activeBorder' : ''}`}
                style={{ marginLeft: "10px" }}>
                친구
              </div>
            </div>

            {/* 채팅/친구 리스트 */}
            <div className='listSize'>
              {toggle ?
                <ChatListPage
                  setMessages={setMessages}
                  selectedRoom={selectedRoom}
                  setSelectedRoom={setSelectedRoom}
                  onOpenProfile={(targetUserId) => { setProfileUserId(targetUserId);
                                                     setShowProfileModal(true);}}/>
                : <FriendListPage />}
            </div>
          </div>
        }

        {/*우측 채팅방 */}
        <div className='rightBarSize'>
          <div className='contentStyle chatSize' style={{ textAlign: "left" }}>
            <div ref={messageContainerRef} className='scroll-container chatDivStyle'>
              <MessageList messages={messages} userData={userData} />
            </div>
            <div className="inputSize">
              <input
                className='chatInputStyle'
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} />
              <button className='chatButtonStyle' onClick={sendMessage}>전송</button>
            </div>
          </div>

          <div style={{ display: "flex" }}>
            <div className='contentStyle adSize'>광고든 뭐든 암튼 뭐든 채울거</div>
            <Link to="/search">
              <div className='contentStyle searchSize'>
                <img src="/SearchIcon.png" className='imgPos'></img>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/*프로필 모달 */}
      {showProfileModal &&
        <MyProfile viewUserId={profileUserId} // 클릭한 유저 아이디
                               isMyProfile={profileUserId === userData.userId} //내 프로필 여부 확인
                               userData={userData} //내 프로필일 때만 사용
                               setUserData={setUserData}
                               onClose={() => setShowProfileModal(false)}
        />}
    </>
  )
}

export default LobbyPage

const MessageList = memo(({ messages, userData }) => {
  return (
    <div className='chatContentStyle'>
      {messages.map((msg, i) => (
        <div key={i} style={{ marginTop: "5px" }}
          className={`${msg.name == userData.userId ? 'myChatStyle' : null}`}>
          <div>{msg.name}</div>
          <div className='chatStyle'>{msg.message}</div>
        </div>
      ))}
    </div>
  );
});
