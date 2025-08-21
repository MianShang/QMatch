import { useState, useContext, useEffect, useRef } from 'react';
import './list.css';

// 전역 유저 State 데이터 가져오기용 Context API import
import { LogContext } from '../../../App.jsx';

// Custom Hook import
import { useSetReadUnReadChat } from '../../../hooks/chatNotice/useSetReadUnReadChat.js';
import { useUnReadChatCount } from '../../../hooks/chatNotice/useUnReadChatCount.js';
import { useChatGetUserList } from '../../../hooks/chat/useChatGetUserList.js'
import { useChatDeleteRoom } from '../../../hooks/chat/useChatDeleteRoom.js'
import { useNewChatNotice } from '../../../hooks/chatNotice/useNewChatNotice.js';
import { useChatGetRooms } from '../../../hooks/chat/useChatGetRooms.js' // 이 훅을 다시 사용합니다.
import { useChatListGet } from '../../../hooks/chatList/useChatListGet.js'

// Modal
import UserHistoryModal from '../../../modal/userHistory/UserHistoryModal.jsx'

// VoiceChat 컴포넌트 추가
import VoiceChat from './VoiceChat';

//포털
import DropdownPortal from './dropDownPotal.jsx'

function ChatListPage({ selectedRoom, setSelectedRoom, setMessages, onOpenProfile, currentUserStatus }) {
  // State 보관함 해체
  const { userData } = useContext(LogContext);

  // State
  const [sendToModalGameName, setSendToModalGameName] = useState(null);
  const [isUserHistoryOpen, setUserHistoryOpen] = useState(false);
  const [historyUserId, setHistoryUserId] = useState(null);

  const [chatListExtend, setChatListExtend] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [chatUserList, setChatUserList] = useState([]);
  
  // chatList를 다시 로컬 state로 관리합니다.
  const [chatList, setChatList] = useState([]);

  // 포털용 전역 드롭다운 
  const [menu, setMenu] = useState(null);


  /* 참여자 패널 열림/좌표 상태 및 참조 */
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [panelRect, setPanelRect] = useState({ left: 0, top: 0, height: 0 });
  const leftColRef = useRef(null);

  // 커스텀훅
  // useChatGetRooms 훅을 다시 호출하여 chatList를 채웁니다.
  useChatGetRooms(userData, setChatList);                      // 로그인한 유저의 채팅방 가져오는 커스텀훅
  useUnReadChatCount(userData, chatList, setUnreadCounts);     // 초기에 저장된 채팅방의 안읽은 메세지 개수 카운트 커스텀훅
  useNewChatNotice(userData, selectedRoom, setUnreadCounts);   // 저장한 채팅방에 새로운 메세지 도착시 알림개수 처리하는 커스텀 훅 

  const getChatUserList = useChatGetUserList(setChatUserList);
  const deleteUserRoom = useChatDeleteRoom();
  const getChatList = useChatListGet();
  const setRead = useSetReadUnReadChat(userData);


  // 아이콘
  function setGameIcon(gameName) {
    switch (gameName) {
      case "overwatch": return "/gameIcons/overwatch_Icon.png";
      case "lol": return "/gameIcons/lol_Icon.png";
      case "dnf": return "/gameIcons/dnf_Icon.png";
      case "maplestory": return "/gameIcons/maplestory_Icon.png";
      case "lostark": return "/gameIcons/lostark_Icon.png";
      default: return "https://placehold.co/45";
    }
  }

  // 상태 아이콘 매핑 함수 추가
  function getStatusIcon(status) {
    if (status === '온라인') return '🟢';
    if (status === '자리비움') return '🟠';
    return '🔴';
  }

  /* 상태 그룹화(온라인/오프라인) */
  function splitMembersByStatus(list) {
    // 현재 로그인된 유저의 상태를 useUserStatusReporter 훅이 반환하는 상태로 업데이트
    const updatedList = list.map(u =>
      u.userId === userData.userId ? { ...u, status: currentUserStatus } : u
    );
    const online = updatedList.filter(u => u.status === '온라인');
    const away = updatedList.filter(u => u.status === '자리비움');
    const offline = updatedList.filter(u => u.status === '오프라인' || !u.status);
    return { online, away, offline };
  }

  /* 패널을 왼쪽 리스트 오른쪽 경계(=채팅 내부 시작점)에 붙이기 위한 위치 측정 */
  function measurePanel() {
    if (!leftColRef.current) return;
    const r = leftColRef.current.getBoundingClientRect();
    setPanelRect({ left: r.right, top: r.top, height: r.height });
  }

  /* 패널 열릴 때/리사이즈 시 위치 재측정 */
  useEffect(() => {
    if (!isMembersOpen) return;
    measurePanel();
    const onResize = () => measurePanel();
    window.addEventListener('resize', onResize);
    const id = setInterval(measurePanel, 300);
    return () => { window.removeEventListener('resize', onResize); clearInterval(id); };
  }, [isMembersOpen]);

  /* 열기/닫기 헬퍼 */
  function openMembers(roomId) {
    setIsMembersOpen(true);
    getChatUserList(roomId);
    setTimeout(measurePanel, 0);
  }
  function closeMembers() {
    setIsMembersOpen(false);
  }


  return (
    <div className='listRouteSize contentStyle' ref={leftColRef}>

      {/* 전적 모달 */}
      {isUserHistoryOpen && (
        <UserHistoryModal
          sendToModalGameName={sendToModalGameName}
          setUserHistoryOpen={setUserHistoryOpen}
          historyUserId={historyUserId}
        />
      )}

      {/* 참여자 패널(채팅창 내부 시작점에 맞춰 뜸) */}
      <div
        className={`membersDrawerInline ${isMembersOpen ? 'open' : ''}`}
        style={{
          left: panelRect.left + 'px',
          top: panelRect.top + 'px',
          height: panelRect.height + 'px'
        }}
      >
        <div className="membersDrawerHeader">
          <span>참여자</span>
          <button className="membersCloseBtn" onClick={closeMembers} title="닫기">✕</button>
        </div>
        <div className="membersListScroll">
          {chatUserList.map(u => (
            <div className="membersRow" key={u.userId}>
              <span className="membersName">
                {u.userId}
                {u.status && <span className="membersDot">{getStatusIcon(u.status)}</span>}
              </span>
              <button
                className="membersMoreBtn"
                onClick={() => { setHistoryUserId(u.userId); setUserHistoryOpen(true); }}
                title="상세보기"
              >…</button>
            </div>
          ))}
          {chatUserList.length === 0 && (
            <div className="membersEmpty">참여자가 없습니다.</div>
          )}
        </div>

        {/* 상태별 그룹 오버레이 (기존 리스트 위에 덮어씀) */}
        <div className="membersOverlayGrouped">
          {(() => {
            const { online, away, offline } = splitMembersByStatus(chatUserList);

            return (
              <>
                {/* 온라인 */}
                <div className="membersSectionHeader">온라인 — {online.length}</div>
                {online.map(u => (
                  <div className="membersRow" key={'on-' + u.userId}>
                    <span className="membersName">
                      {u.userId}
                      <span className="membersDot">{getStatusIcon(u.status)}</span>
                    </span>
                    <button
                      className="membersMoreBtn"
                      onClick={() => { setHistoryUserId(u.userId); setUserHistoryOpen(true); }}
                      title="상세보기"
                    >…</button>
                  </div>
                ))}

                {/* 자리비움 */}
                <div className="membersSectionHeader" style={{ marginTop: 10 }}>
                  자리비움 — {away.length}
                </div>
                {away.map(u => (
                  <div className="membersRow" key={'away-' + u.userId}>
                    <span className="membersName">
                      {u.userId}
                      <span className="membersDot">{getStatusIcon(u.status)}</span>
                    </span>
                    <button
                      className="membersMoreBtn"
                      onClick={() => { setHistoryUserId(u.userId); setUserHistoryOpen(true); }}
                      title="상세보기"
                    >…</button>
                  </div>
                ))}

                {/* 오프라인 */}
                <div className="membersSectionHeader" style={{ marginTop: 10 }}>
                  오프라인 — {offline.length}
                </div>
                {offline.map(u => (
                  <div className="membersRow" key={'off-' + u.userId}>
                    <span className="membersName membersName--offline">
                      {u.userId}
                      <span className="membersDot">{getStatusIcon(u.status)}</span>
                    </span>
                    <button
                      className="membersMoreBtn"
                      onClick={() => { setHistoryUserId(u.userId); setUserHistoryOpen(true); }}
                      title="상세보기"
                    >…</button>
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      </div>

      {/* 상단: 선택한 채팅방 카드 */}
      {selectedRoom && (
        <div className='selectCardStyle'>
          <div className='selectCardHeaderStyle'>
            <img src={setGameIcon(selectedRoom.gameName)} alt="방 아이콘" className="chatCardImage" />
            <p>{selectedRoom.name}</p>
            <p></p>
            {/* 선택된 방 참여자 패널 열기 버튼 */}
            <button
              className="membersIconBtn"
              title="참여자 보기"
              onClick={() => selectedRoom && openMembers(selectedRoom.id)}
            >👥</button>
          </div>

          {/* 더보기 클릭시 채팅방 구독한 유저 리스트 표시 */}
          {chatListExtend &&
            <div className='selectCardUserListStyle'>
              {chatUserList.map((item) => (
                <div key={item.userId} className='UserListContentStyle'>
                  <p>{item.userId}</p>

                  {/* 음성채팅 버튼 */}
                  {item.userId === userData.userId && selectedRoom && (
                    <VoiceChat
                      channelName={selectedRoom.id}
                      uid={userData.userId}
                    />
                  )}

                  {/* … 버튼 : 클릭 좌표로 포털 메뉴 오픈 */}
                  <div
                    className="MoreButtonStyle"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const menuWidth = 170;
                      const gap = 8;
                      setMenu({
                        userId: item.userId,
                        gameName: selectedRoom?.gameName,
                        x: Math.max(8, rect.right - menuWidth),
                        y: rect.bottom + gap,
                      });
                    }}
                  >
                    …
                  </div>
                </div>
              ))}
            </div>
          }

          {/* 확장 토글 */}
          <div onClick={() => {
            setChatListExtend(!chatListExtend);
            getChatUserList(selectedRoom.id);
          }}>
            {!chatListExtend ? <p>▼</p> : <p>▲</p>}
          </div>
        </div>
      )}

      {/* 하단: 저장된 채팅방 리스트 */}
      <div className="chatListScrollWrapper chatListScroll">
        {chatList.map((item) => {
          const unread = unreadCounts[item.chatRoom.id] || 0;
          return (
            <div
              key={item.id}
              className="chatCard"
              onClick={() => {
                setSendToModalGameName(item.chatRoom.gameName);
                setChatListExtend(false);
                setSelectedRoom(item.chatRoom);
                getChatList(item.chatRoom.id, setMessages);
                setRead(item.chatRoom);
                setUnreadCounts(prev => ({ ...prev, [item.chatRoom.id]: 0 }));
              }}
            >
              <div className="chatCardHeader">
                {/* 게임 아이콘 */}
                <img src={`${setGameIcon(item.chatRoom.gameName)}`} alt="방 아이콘" className="chatCardImage" />

                {/* 채팅방 이름 */}
                <span className="chatCardTitle">{item.chatRoom.name} </span>

                {/* 카드에서 바로 참여자 패널 열기 */}
                <button
                  className="chatCardMembersBtn"
                  title="참여자 보기"
                  onClick={(e) => { e.stopPropagation(); openMembers(item.chatRoom.id); }}
                >👥</button>

                {/* 채팅방 삭제 */}
                <span className="chatCardDelete"
                  onClick={(e) => { e.stopPropagation(); deleteUserRoom(item.id); }}>
                  🗑
                </span>
              </div>

              {/* 안읽은 메세지 개수를 출력한다.*/}
              {unread > 0 &&
                <div className="chatCardFooter">
                  <span className="chatCardBadge">{unread}</span>
                  <span className="chatCardLastMessage">안읽은 메세지가 있습니다</span>
                </div>
              }
            </div>)
        })}
      </div>

      {/* 드롭 다운을 최상단에 위치 */}
      {menu && (
        <DropdownPortal x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          <div className="dropdownMenu">
            <p onClick={() => {
              onOpenProfile?.(menu.userId);
              setMenu(null);
            }}> 프로필 보기</p>

            <p onClick={() => {
              console.log('간단 스펙 보기', menu.userId);
              setSendToModalGameName(menu.gameName);
              setHistoryUserId(menu.userId);
              setUserHistoryOpen(true)
              setMenu(null);
            }}>
              간단 스펙 보기
            </p>

            <p onClick={() => { console.log('강퇴', menu.userId); setMenu(null); }}>
              (방장) 강퇴하기
            </p>

            <p onClick={() => { console.log('차단', menu.userId); setMenu(null); }}>
              차단하기
            </p>
          </div>
        </DropdownPortal>
      )}
    </div>
  )
}

export default ChatListPage