import { useRef, useState, useEffect, useContext, memo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';
import './lobbyPage.css'

// 컴포넌트 import
import ChatListPage from './lobbyPageRoute/chatListPage.jsx';
import FriendListPage from './lobbyPageRoute/friendListPage.jsx';
import MyProfile from '../../feature/profile/myProfileModal.jsx';
import VoiceChat from './lobbyPageRoute/VoiceChat.jsx';
import VoiceChatModal from '../../modal/voiceChatSetting/VoiceChatModal.jsx';
import ChatRoom from './ChatRoom.jsx';

import UserHistoryModal from '../../modal/userHistory/UserHistoryModal.jsx';
// JoinRequestModal 제거 - 기존 UI에 통합

//리액트 아이콘
import { MdOutlineConstruction } from "react-icons/md";

// 로그인 체크용 Context API import
import { LogContext } from '../../App.jsx'

// Custom hook import
import { useChatSubscriber } from '../../hooks/chat/useChatSubscriber.js'
import { useChatSender } from '../../hooks/chat/useChatSender.js'
import { useLoginCheck } from '../../hooks/login/useLoginCheck.js';
import { useLogout } from '../../hooks/login/useLogout.js';
import { useLocation } from 'react-router-dom';
import { useGlobalStomp } from '../../hooks/stomp/useGlobalStomp.js';
import { useChatListGet } from '../../hooks/chatList/useChatListGet.js';
import { useSetReadUnReadChat } from '../../hooks/chatNotice/useSetReadUnReadChat.js';

// 상태 체크 훅 import 추가
import useUserStatusReporter from '../../hooks/status/useUserStatusReporter.js';

function LobbyPage() {

  // 사이드바 프로필 이미지 클릭시 내 프로필 상세 정보를 보여주는 모달창을 띄어줌
  const [showProfileModal, setShowProfileModal] = useState(false);
  // 프로필 유저 구분
  const [profileUserId, setProfileUserId] = useState(null);

  // 상태 패널 열림 여부
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(false);

  // 사용자 전적 모달 상태
  const [isUserHistoryOpen, setIsUserHistoryOpen] = useState(false);
  const [historyUserId, setHistoryUserId] = useState(null);
  const [sendToModalGameName, setSendToModalGameName] = useState('');

  // 사이드바 프로필 이미지 클릭시 중앙 div는 사라지게 - 기본값 true(중앙 div 표시)
  const [showMidBar, setShowMidBar] = useState(true);

  // toggle State를 기준으로 채팅 / 친구 컴포넌트 교체 - 기본값 true (채팅)
  const [toggle, setToggle] = useState(true);

  // 토글 상태 변경 시 참여자 패널 자동 닫기
  const handleToggleChange = (newToggle) => {
    setToggle(newToggle);
    if (!newToggle) {
      // 친구 토글로 변경 시 참여자 패널 닫기
      setIsMembersPanelOpen(false);
    }
  };

  const [selectedRoom, setSelectedRoom] = useState();      // 실시간 참여한 채팅방 데이터를 담은 State
  const [messages, setMessages] = useState([]);      // 보낼 메세지
  const [client, setClient] = useState(null);      // client 연결 여부 State
  const [input, setInput] = useState('');      // input 입력 Sate      
  const [selectedFriendRoom, setSelectedFriendRoom] = useState(null); //친구 선택 채팅방
  const [friendMessages, setFriendMessages] = useState([]); // 친구 1:1 채팅 메시지

  // State 보관함 해체
  const { isLogIn, setIsLogIn, userData, setUserData, setHasUnreadMessages, theme, toggleTheme } = useContext(LogContext)

  // 전역 STOMP 클라이언트 초기화
  const globalStomp = useGlobalStomp(userData);

  // 메시지 로딩 및 읽음 처리 훅
  const getChatList = useChatListGet();
  const setRead = useSetReadUnReadChat(userData);

  // // userData가 로드될 때까지 로딩
  // if (!userData) {
  //   return <div>userData 로딩중</div>; 
  // }

  // voiceChat
  const [voiceChatRoomId, setVoiceChatRoomId] = useState(null);
  const [voiceSpeakers, setVoiceSpeakers] = useState({});
  const [localMuted, setLocalMuted] = useState(false);
  const [joinedVoice, setJoinedVoice] = useState(false);
  const voiceChatRef = useRef(null);

  // 음성설정 모달
  const [showVoiceChatModal, setShowVoiceChatModal] = useState(false);

  // 입장 신청 관리 상태 제거 - 기존 UI에 통합

  // 참여자 패널 상태
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false);

  // 커스텀 훅 가져오기
  // --UseEffect
  useLoginCheck(isLogIn);                                         // 로그인 체크 훅
  useChatSubscriber(selectedRoom, setMessages, setClient, userData, globalStomp);    // 채팅방 구독 훅

  // -- Function
  const logoutFunc = useLogout();                                          // 로그아웃 훅
  const sendMessage = useChatSender(client, selectedRoom, userData, input, setInput);   // 메세지 전송 훅 

  const location = useLocation();                                      // 방 입장 시 전달된 state 확인
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

  //친구 1:! 채팅방 열기 함수
    const onOpenChatRoom = async (friendId) => {
        try {
            // 채팅 탭으로 전환
            handleToggleChange(true);
            
            // friendsId로 채팅방 ID를 찾거나 생성하는 백엔드 API 호출
            const response = await axios.get(`/api/friends/chatroom/${friendId}/${userData.userId}`);
            const chatRoom = response.data; // 서버에서 채팅방 정보 반환
            
            // 상태 업데이트
            setSelectedFriendRoom(chatRoom);
            setSelectedRoom(null); 
            // 메시지 로딩 및 읽음 처리
            getChatList(chatRoom.id, setFriendMessages);
            setRead({ id: chatRoom.id });
            
        } catch (error) {
            console.error('채팅방 로드 실패:', error);
            // 에러 처리 로직 (예: 에러 메시지 토스트)
        }
    };

  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  //프로필 정보 DB에서 불러오기
  useEffect(() => {
    // userData.userId가 없으면 아무 작업도 하지 않음
    if (!userData?.userId) return;
  
    axios.get("/api/profile/user/info", { params: { userId: userData.userId } })
      .then(res => {
        setUserData(prevUserData => ({
          ...prevUserData, //기존 데이터를 모두 복사
          ...res.data,     //새로 받은 데이터로 덮어쓰기
          //authorities 만큼은 무조건 기존 값으로 다시 덮어쓰기
          authorities: prevUserData.authorities 
        }));
      })
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
        console.log('서버에서 받은 방 정보:', data);
        setSelectedRoom({
          id: data.id,
          name: data.name ?? s.chatName,
          gameName: data.gameName ?? s.gameName,
          tagNames: Array.isArray(data.tagNames) ? data.tagNames : (s.tagNames ?? []),
          currentUsers: (typeof data.currentUsers === 'number') ? data.currentUsers : s.currentUsers,
          maxUsers: (typeof data.maxUsers === 'number') ? data.maxUsers : s.maxUsers,
          hostUserId: data.hostUserId, // 방장 ID 추가
        });
      } catch (e) {
        setSelectedRoom({
          id: s.roomId,
          name: s.chatName,
          gameName: s.gameName,
          tagNames: s.tagNames ?? [],
          currentUsers: s.currentUsers,
          maxUsers: s.maxUsers,
          hostUserId: s.hostUserId, // chatList에서 hostUserId 가져오기
        });
      } finally {
        setListRefreshTick(t => t + 1);  // 방 리스트를 새로고침하도록 트리거

        // 채팅방 이동 시 메시지 로딩 및 읽음 처리
        console.log('채팅방 이동: 메시지를 가져옵니다. roomId:', s.roomId);
        getChatList(s.roomId, setMessages);
        setRead({ id: s.roomId });
      }
    })();
  }, [location.key]);

  // userData가 로드될 때까지 로딩
  if (!userData) {
    return <div>userData 로딩중</div>;
  }


  return (
    <>
      <div className='fullscreen'>
        {/* 좌측 친구/채팅 바 */}
        {showMidBar &&
          <div className='leftBarSize'>
            <div className="toggle-container">
              <div onClick={() => { handleToggleChange(true); }}
                className={`toggleSwitchText toggleSwitch ${toggle ? 'activeBorder' : ''}`} >
                채팅
              </div>

              <div onClick={() => handleToggleChange(false)}
                className={`toggleSwitchText toggleSwitch ${!toggle ? 'activeBorder' : ''}`}>
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
                  globalStomp={globalStomp}
                  refreshTick={listRefreshTick}
                  voiceSpeakers={voiceSpeakers}
                  onJoinVoice={(roomId) => {
                    setVoiceChatRoomId(roomId)
                    // ref를 통해 VoiceChat 컴포넌트의 joinChannel 함수를 호출
                    if (voiceChatRef.current) {
                      voiceChatRef.current.joinChannel(roomId);
                    }
                  }}
                  // UserHistoryModal 관련 props
                  isUserHistoryOpen={isUserHistoryOpen}
                  setIsUserHistoryOpen={setIsUserHistoryOpen}
                  historyUserId={historyUserId}
                  setHistoryUserId={setHistoryUserId}
                  sendToModalGameName={sendToModalGameName}
                  setSendToModalGameName={setSendToModalGameName}
                  onLeaveVoice={() => {
                    if (voiceChatRef.current) {
                      voiceChatRef.current.leaveChannel();
                    }
                  }}
                  onToggleMute={() => {
                    if (voiceChatRef.current) {
                      voiceChatRef.current.toggleMute();
                    }
                  }}
                  localMuted={localMuted}
                  joinedVoice={joinedVoice}
                  voiceChatRoomId={voiceChatRoomId}
                  onMembersPanelToggle={setIsMembersPanelOpen}
                  setHasUnreadMessages={setHasUnreadMessages}
                />
                : <FriendListPage 
                userId={userData.userId}
                onOpenChatRoom={onOpenChatRoom} // 함수 전달
                 />}
            </div>

            {/* 하단 버튼 영역 */}
            <div className="bottom-buttons-container">
            {userData?.authorities?.some(auth => auth.authority === 'ROLE_ADMIN') && (
                  <button><Link to="/admin"><MdOutlineConstruction style={{fontSize: "28px", padding: "0px"}} /></Link></button>
                )}
              {/* 프로필 이미지 버튼 */}
              <div className="profile-button-wrapper">
                <img
                  src={userData?.userProfile ? `${userData.userProfile}` : "https://placehold.co/250x250"}
                  onClick={() => { setProfileUserId(userData?.userId); setShowProfileModal(true); }}
                  className="profile-button"
                  alt="프로필"
                />
                {/* 상태 표시 - 프로필 이미지 우상단 */}
                <div
                  className="status-indicator-wrapper"
                  onMouseEnter={() => setIsStatusPanelOpen(true)}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setIsStatusPanelOpen(false);
                    }
                  }}
                >
                  <div className="status-indicator">
                    <span>{getStatusIcon(userStatus)}</span>
                  </div>

                  {isStatusPanelOpen && (
                    <div
                      className="status-side-panel"
                      onMouseEnter={() => setIsStatusPanelOpen(true)}
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
              </div>

              {/* 테마 전환 버튼 */}
              <div className="theme-toggle-wrapper">
                <button
                  onClick={toggleTheme}
                  className="theme-toggle-button"
                  title={`현재 테마: ${theme === 'dark' ? '다크' : theme === 'light' ? '라이트' : theme === 'pink' ? '핑크' : '블루'}`}
                >
                  {theme === 'dark' && '🌙'}
                  {theme === 'light' && '☀️'}
                  {theme === 'pink' && '💖'}
                  {theme === 'blue' && '💙'}
                </button>
              </div>

              {/* 음성 설정 버튼 */}
              <button
                className="bottom-button"
                aria-label="음성 채팅 설정"
                onClick={() => { setShowVoiceChatModal(true); }}
              >
                <svg className="button-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.32.57 3.55.57.55 0 1 .45 1 1v3.5c0 .55-.45 1-1 1C12.95 22 2 11.05 2 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.23.2 2.43.57 3.55.12.35.03.75-.24 1.02l-2.2 2.2z" />
                </svg>
              </button>


              {/* 전체 설정 버튼 */}
              <button
                className="bottom-button"
                aria-label="설정"
                onClick={() => {
                  // 설정 모달 열기 (추후 구현)
                  console.log('설정 버튼 클릭');
                }}
              >
                <svg className="button-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
                </svg>
              </button>
            </div>
          </div>
        }


        {/*우측 채팅방 */}
        <ChatRoom
          userData={userData}
          selectedRoom={selectedRoom}
          selectedFriendRoom={selectedFriendRoom}
          messages={messages}
          friendMessages={friendMessages}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          messageContainerRef={messageContainerRef}
          isMembersPanelOpen={isMembersPanelOpen}
        />
      </div>

      {/*프로필 모달 */}
      {showProfileModal &&
        <MyProfile viewUserId={profileUserId} // 클릭한 유저 아이디
          isMyProfile={profileUserId === userData.userId} //내 프로필 여부 확인
          userData={userData} //내 프로필일 때만 사용
          setUserData={setUserData}
          onClose={() => setShowProfileModal(false)}
        />}

      {/*음성설정 모달*/}
      {showVoiceChatModal &&
        <VoiceChatModal viewUserId={profileUserId}
          userData={userData}
          setUserData={setUserData}
          onClose={() => setShowVoiceChatModal(false)}
        />}

      {/* VoiceChat 컴포넌트를 lobbyPage에 렌더링 */}
      <VoiceChat
        channelName={voiceChatRoomId}
        uid={userData.userId}
        onSpeakers={setVoiceSpeakers}
        onLocalMuteChange={setLocalMuted}
        onJoinChange={setJoinedVoice}
        ref={voiceChatRef}
      />

      {/* 입장 신청 관리 모달 제거 - 기존 UI에 통합 */}

      {/* 사용자 전적 모달 */}
      {isUserHistoryOpen && (
        <UserHistoryModal
          sendToModalGameName={sendToModalGameName}
          setUserHistoryOpen={setIsUserHistoryOpen}
          historyUserId={historyUserId}
        />
      )}
    </>
  )
}

export default LobbyPage

