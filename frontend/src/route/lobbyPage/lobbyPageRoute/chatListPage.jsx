import { useState, useContext } from 'react'
import './list.css'

// 위치 측정을 위해 별도 import (기존 줄 수정 없이 추가)
import { useEffect, useRef } from 'react'

// 전역 유저 State 데이터 가져오기용 Comtext API import
import { LogContext } from '../../../App.jsx'

// Custom Hook import
import { useSetReadUnReadChat } from '../../../hooks/chatNotice/useSetReadUnReadChat.js';
import { useUnReadChatCount }   from '../../../hooks/chatNotice/useUnReadChatCount.js';
import { useChatGetUserList }   from '../../../hooks/chat/useChatGetUserList.js'
import { useChatDeleteRoom }    from '../../../hooks/chat/useChatDeleteRoom.js'
import { useNewChatNotice }     from '../../../hooks/chatNotice/useNewChatNotice.js';
import { useChatGetRooms }      from '../../../hooks/chat/useChatGetRooms.js'
import { useChatListGet }       from '../../../hooks/chatList/useChatListGet.js'

// Modal import
import UserHistoryModal  from '../../../modal/userHistory/UserHistoryModal.jsx'


function ChatListPage({ selectedRoom, setSelectedRoom, setMessages }) {

  // State 보관함 해체
  const { userData } = useContext(LogContext);

  // State 선언
  const [sendToModalGameName , setSendToModalGameName] = useState();        // 모달창에 전송할 게임명
  const [isUserHistoryOpen, setUserHistoryOpen]        = useState(false);    // 모달창 열림 여부
  const [historyUserId, setHistoryUserId]              = useState();       // 모달창에 전송할 해당 유저 ID


  const [chatListExtend, setChatListExtend] = useState(false);  // 채팅 리스트 확장 css 여부 State
  const [unreadCounts, setUnreadCounts]     = useState({});     // 채팅방별 안읽은 메세지 개수 담을 State
  const [chatUserList, setChatUserList]     = useState([]);     // 채팅리스트 확장시 유저를 담을 State
  const [chatList, setChatList]             = useState([]);     // 저장한 채팅방 리스트 State 

  /* 참여자 패널 열림/좌표 상태 및 참조 */
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [panelRect, setPanelRect] = useState({ left: 0, top: 0, height: 0 });
  const leftColRef = useRef(null);

  // 커스텀훅 가져오기
  // -- UseEffect
  useChatGetRooms(userData, setChatList);                       // 로그인한 유저의 채팅방 가져오는 커스텀훅
  useUnReadChatCount(userData, chatList, setUnreadCounts);      // 초기에 저장된 채팅방의 안읽은 메세지 개수 카운트 커스텀훅
  useNewChatNotice(userData, selectedRoom, setUnreadCounts);    // 저장한 채팅방에 새로운 메세지 도착시 알림개수 처리하는 커스텀 훅훅 

  // -- Function
  const getChatUserList = useChatGetUserList(setChatUserList);  // 선택한 채팅방의 유저 목록을 불러오는 함수
  const deleteUserRoom  = useChatDeleteRoom();                  // 저장한 채팅방 지우는 함수
  const getChatList     = useChatListGet();                     // 실시간으로 구독한 채팅방의 채팅 목록 가져오는 함수
  const setRead         = useSetReadUnReadChat(userData);       // 채팅방 입장시 해당 채팅방의 메세지를 읽음 처리


  // 채팅방 속성 중 게임 이름에 따른 아이콘 세팅 함수
  function setGameIcon(gameName){
    switch(gameName)
    {
      case "overwatch" :
        return "/gameIcons/overwatch_Icon.png";

      case "lol" :
        return "/gameIcons/lol_Icon.png";

      case "dnf" :
        return "/gameIcons/dnf_Icon.png";

      case "maplestory" :
        return "/gameIcons/maplestory_Icon.png";

       case "lostark" :
        return "/gameIcons/lostark_Icon.png";

      default:
        return "https://placehold.co/45";
    }
  }

  // 상태 아이콘 매핑 함수 추가
  function getStatusIcon(status) {
    if (status === '온라인') return '🟢';
    if (status === '자리비움') return '🟠';
    return '🔴';
  }

  /* 상태 그룹화(온라인/오프라인) */
  function splitMembersByStatus(list){
    const online  = list.filter(u => u.status === '온라인');
    const offline = list.filter(u => u.status !== '온라인'); // 자리비움 포함
    return { online, offline };
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
  function openMembers(roomId){
    setIsMembersOpen(true);
    getChatUserList(roomId);
    setTimeout(measurePanel, 0);
  }
  function closeMembers(){
    setIsMembersOpen(false);
  }


  return (
    <div className='listRouteSize contentStyle' ref={leftColRef}>
      {
        isUserHistoryOpen ?  
        <UserHistoryModal 
          sendToModalGameName = { sendToModalGameName }
          setUserHistoryOpen  = { setUserHistoryOpen } 
          historyUserId       = { historyUserId }
          
        /> 
        : null
      }

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
            const { online, offline } = splitMembersByStatus(chatUserList);

            return (
              <>
                {/* 온라인 */}
                <div className="membersSectionHeader">온라인 — {online.length}</div>
                {online.map(u => (
                  <div className="membersRow" key={'on-' + u.userId}>
                    <span className="membersName">
                      {u.userId}
                      <span className="membersDot">{getStatusIcon('온라인')}</span>
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
                      <span className="membersDot">{getStatusIcon('오프라인')}</span>
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

      {/* 실시간 참여중인 채팅방 상단 표시 */}
      { selectedRoom ?

        <div className='selectCardStyle'>

          <div className='selectCardHeaderStyle'>

            <img src={`${setGameIcon(selectedRoom.gameName)}`} alt="방 아이콘" className="chatCardImage" />
            {/* 실시간 참여중인 채팅방 이름 표시 */}
            <p>{ selectedRoom ? selectedRoom.name : null }</p>
            <p></p>

            {/* 선택된 방 참여자 패널 열기 버튼 */}
            <button
              className="membersIconBtn"
              title="참여자 보기"
              onClick={() => selectedRoom && openMembers(selectedRoom.id)}
            >👥</button>
          </div>  
         
          {/* 더보기 클릭시 채팅방 구독한 유저 리스트 표시 */}
          { chatListExtend  ?
            <div className='selectCardUserListStyle'>
          
              {/* 유저가 구독한 채팅방 리스트 출력 */}  
              { chatUserList.map((item, i) => (

                <div key = { item.userId } className='UserListContentStyle'>
                  {/* 유저 아이디 + 상태 아이콘 추가 */}
                  <p>
                    { item.userId }
                    { item.status && <span style={{ marginLeft: "5px" }}>{ getStatusIcon(item.status) }</span> }
                  </p>

                  <div className="MoreButtonStyle" onClick={() => {
                    setHistoryUserId(item.userId);
                    setUserHistoryOpen(true);
                  }}>…</div>
                  
                </div>
              )) }
            </div> 
          : null }

            {/* 하단 버튼 */}
            <div onClick={()=>{ 
              setChatListExtend(!chatListExtend);   // 확장 여부 State 반전
              getChatUserList(selectedRoom.id);     // 해당 채팅방의 유저 목록을 가져오는 커스텀 훅훅
            }}>
            { !chatListExtend ? <p>▼</p> : <p>▲</p> }
          </div>
        </div>
      : null}

      
     <div className="chatListScrollWrapper chatListScroll">

        {/* 유저가 저장한 채팅방 리스트 출력 */}
        { chatList.map((item, i) => {
          
          // 채팅방별 안읽은 메세지 개수 
          const unread = unreadCounts[item.chatRoom.id] || 0;
          
          return (
            <div key={item.id} className="chatCard"

            onClick={() => { 
              setSendToModalGameName(item.chatRoom.gameName);
              setChatListExtend(false);
              setSelectedRoom(item.chatRoom);
              getChatList(item.chatRoom.id, setMessages);
              setRead(item.chatRoom);
              unreadCounts[item.chatRoom.id] = 0;
            }}>

              <div className="chatCardHeader">
                {/* 게임 아이콘 */}
                <img src={`${setGameIcon(item.chatRoom.gameName)}`} alt="방 아이콘" className="chatCardImage" />

                {/* 채팅방 이름 */}
                <span className="chatCardTitle">{ item.chatRoom.name } </span>

                {/* 카드에서 바로 참여자 패널 열기 */}
                <button
                  className="chatCardMembersBtn"
                  title="참여자 보기"
                  onClick={(e) => { e.stopPropagation(); openMembers(item.chatRoom.id); }}
                >👥</button>

                {/* 채팅방 삭제 */}
                <span  className="chatCardDelete"
                  onClick={(e) => { e.stopPropagation(); deleteUserRoom(item.id); }}>
                  🗑
                </span>
              </div>

            {/* 안읽은 메세지 개수를 출력한다.*/}
            { unread > 0 ?
              <div className="chatCardFooter">
                <span className="chatCardBadge">{ unread }</span>
                <span className="chatCardLastMessage">안읽은 메세지가 있습니다</span>
              </div>
              : null }
          </div>)
        })}
      </div>
    </div>
  )
}

export default ChatListPage
