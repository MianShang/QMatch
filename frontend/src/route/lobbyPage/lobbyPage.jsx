import { useRef, useState, useEffect, useContext, memo } from 'react'
import { Routes, Route, Link, useNavigate} from 'react-router-dom'
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
import { useLocation }        from 'react-router-dom';

// 상태 체크 훅 import 추가
import useUserStatusReporter from '../../hooks/status/useUserStatusReporter.js';

function LobbyPage() {

  // 사이드바 프로필 이미지 클릭시 내 프로필 상세 정보를 보여주는 모달창을 띄어줌
  const [showProfileModal, setShowProfileModal] = useState(false);
  // 프로필 유저 구분
  const [profileUserId, setProfileUserId] = useState(null);

  // 상태 패널 열림 여부
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(false);

  // 사이드바 프로필 이미지 클릭시 중앙 div는 사라지게 - 기본값 true(중앙 div 표시)
  const [showMidBar, setShowMidBar] = useState(true);

  // toggle State를 기준으로 채팅 / 친구 컴포넌트 교체 - 기본값 true (채팅)
  const [toggle, setToggle] = useState(true);

  const [selectedRoom, setSelectedRoom] = useState();      // 실시간 참여한 채팅방 데이터를 담은 State
  const [messages, setMessages] = useState([]);      // 보낼 메세지
  const [client, setClient] = useState(null);      // client 연결 여부 State
  const [input, setInput] = useState('');      // input 입력 Sate      

  // State 보관함 해체
  const { isLogIn, setIsLogIn, userData, setUserData } = useContext(LogContext)

  // 커스텀 훅 가져오기
  // --UseEffect
  useLoginCheck(isLogIn);                                          // 로그인 체크 훅
  useChatSubscriber(selectedRoom, setMessages, setClient, userData);    // 채팅방 구독 훅

  // -- Function
  const logoutFunc = useLogout();                                          // 로그아웃 훅
  const sendMessage = useChatSender(client, selectedRoom, userData, input, setInput);   // 메세지 전송 훅 

  const location = useLocation();                                 // 방 입장 시 전달된 state 확인
  const [listRefreshTick, setListRefreshTick] = useState(0);      // 방 목록 강제 리렌더링 트리거

  // useUserStatusReporter 훅에서 반환되는 새로운 함수를 받음
  const [userStatus, manuallySetStatus] = useUserStatusReporter(userData?.userId);

  // 상태 아이콘 매핑 함수 추가
  function getStatusIcon(status) {
    if (status === '온라인') return '🟢';
    if (status === '자리비움') return '🟠';
    return '🔴';
  }

  // 스크롤 하단 자동 이동 Effect
  const messageContainerRef = useRef(null);

  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);
  
  //프로필 정보 DB에서 불러오기
  useEffect(() => {
    if (!userData?.userId) return;
    axios.get("/api/profile/user/info", { params: { userId: userData.userId } })
      .then(res => setUserData(res.data))
      .catch(err => console.error("유저 정보 불러오기 실패:", err));
  }, [userData?.userId, setUserData]);

  useEffect(() => {
    
    const s = location.state;
    
    if (!s?.roomId) return;

    setSelectedRoom(undefined);
    setMessages([]);
    setShowMidBar(true);

    (async () => {
      try {
            const id = encodeURIComponent(s.roomId);
            const { data } = await axios.get(`/api/chat/rooms/${id}`);
          
            // 서버에서 상세 방 정보를 가져와 state 업데이트
            setSelectedRoom({
              id: data.id,
              name: data.name ?? s.chatName,
              gameName: data.gameName ?? s.gameName,
              tagNames: Array.isArray(data.tagNames) ? data.tagNames : (s.tagNames ?? []),
            });
          } catch (e) {
            console.warn('방 상세 조회 실패. state로 대체:', e);
          
            // 서버 조회 실패 시, props(state) 값으로 대체
            setSelectedRoom({
              id: s.roomId,
              name: s.chatName,
              gameName: s.gameName,
              tagNames: s.tagNames ?? [],
            });
          } finally {
            setListRefreshTick(t => t + 1);  // 방 리스트를 새로고침하도록 트리거
          }
        })();
    }, [location.key]);

  return (
    <>
      <div className='fullscreen' style={{ display: "flex", padding: "10px" }}>

        {/* 좌측 사이드바 - 좌측 사이드바는 showMidBar State를 기준으로 동적 조절*/}
        <div className={`contentStyle ${showMidBar ? 'sideBarSize' : 'sideBarExpanded'}`}>

          {/* 현재 상태 표시 + Hover 패널 */}
          <div
            className="status-wrapper"
            onMouseEnter={() => setIsStatusPanelOpen(true)}
            onMouseLeave={(e) => {
              // 상태 영역과 패널 모두 벗어났을 때만 닫기
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setIsStatusPanelOpen(false);
              }
            }}
          >
            <div className="status-container">
              <span>{getStatusIcon(userStatus)}</span>
              <span> {userStatus}</span>
            </div>

            {isStatusPanelOpen && (
              <div
                className="status-side-panel"
                onMouseEnter={() => setIsStatusPanelOpen(true)}   // 패널 위에서는 안 닫힘
                onMouseLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsStatusPanelOpen(false);
                  }
                }}
              >
                <div className="status-item" onClick={() => manuallySetStatus('온라인')}>🟢 온라인</div>
                <div className="status-item" onClick={() => manuallySetStatus('자리비움')}>🟠 자리 비움</div>
                <div className="status-item" onClick={() => manuallySetStatus('오프라인')}>🔴 오프라인</div>
              </div>
            )}
          </div>


          {/*프로필 이미지 클릭 → 바로 모달 열림 */}
          <img
            src={userData?.userProfile ? `${userData.userProfile}` : "https://placehold.co/250x250"} style={{ width: '80px', height: '80px', objectFit: 'cover' }}
            onClick={() => { setProfileUserId(userData?.userId); setShowProfileModal(true); }}
            className={`${showMidBar ? 'sideBarImgSize' : 'sideBarImgSizeExpanded'}`}
          />
          <p onClick={() => logoutFunc(setIsLogIn)} style={{ cursor: 'pointer', marginTop: '10px' }}>로그아웃</p>
        </div>

        {/* 중앙 친구/채팅 바 */}
        {showMidBar &&
          <div className='midBarSize'>
            <div style={{ display: "flex" }}>
              <div onClick={() => { setToggle(true); }}
                className={`toggleSwitchText contentStyle toggleSwitch ${toggle ? 'activeBorder' : ''}`} >
                채팅
              </div>

              <div onClick={() => setToggle(false)}
                className={`toggleSwitchText contentStyle toggleSwitch ${!toggle ? 'activeBorder' : ''}`}
                style={{ marginLeft: "10px" }}>
                친구
              </div>
            </div>

            <div className='listSize'>
              {toggle ?
                <ChatListPage
                  setMessages={setMessages}
                  selectedRoom={selectedRoom}
                  setSelectedRoom={setSelectedRoom}
                  onOpenProfile={(targetUserId) => { setProfileUserId(targetUserId); setShowProfileModal(true); }}
                  currentUserStatus={userStatus} 
                  refreshTick     = { listRefreshTick }/>
                : <FriendListPage userId={userData.userId}/>}
            </div>
          </div>
        }

        {/*우측 채팅방 */}
        <div className='rightBarSize'>
          <div className='contentStyle chatSize' style={{ textAlign: "left" }}>
            <div ref={messageContainerRef} className='scroll-container chatDivStyle'>
              <MessageList
                messages={messages}
                userData={userData} />
            </div>

            <div className="inputSize">
              <input
                className='chatInputStyle'
                type="text"
                value={input}
                onChange={(e) => { setInput(e.target.value); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { sendMessage(); } }} />

              <button className='chatButtonStyle'
                onClick={() => { sendMessage(); }}> 전송 </button>
            </div>
          </div>

          <div style={{ display: "flex" }}>
            <div className='contentStyle adSize'>
              광고든 뭐든 암튼 뭐든 채울거
            </div>
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
      {
        messages.map((msg, i) => (

          <div key={i} style={{ marginTop: "5px" }}
            className={`${msg.name == userData?.userId ? 'myChatStyle' : null} `}>

            <div>{msg.name}</div>

            <div className='chatStyle'>{msg.message}</div>

          </div>
        ))
      }
    </div>
  );
});