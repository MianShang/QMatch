import { useState, useContext } from 'react'
import './list.css'

// 전역 유저 State 데이터 가져오기용 Context API import
import { LogContext } from '../../../App.jsx'

// Custom Hook import
import { useSetReadUnReadChat } from '../../../hooks/chatNotice/useSetReadUnReadChat.js';
import { useUnReadChatCount }   from '../../../hooks/chatNotice/useUnReadChatCount.js';
import { useChatGetUserList }   from '../../../hooks/chat/useChatGetUserList.js'
import { useChatDeleteRoom }    from '../../../hooks/chat/useChatDeleteRoom.js'
import { useNewChatNotice }     from '../../../hooks/chatNotice/useNewChatNotice.js';
import { useChatGetRooms }      from '../../../hooks/chat/useChatGetRooms.js'
import { useChatListGet }       from '../../../hooks/chatList/useChatListGet.js'

// Modal
import UserHistoryModal  from '../../../modal/userHistory/UserHistoryModal.jsx'


//포털
import DropdownPortal from './dropDownPotal.jsx'

function ChatListPage({ selectedRoom, setSelectedRoom, setMessages, onOpenProfile  }) {
  // State 보관함 해체
  const { userData } = useContext(LogContext);

  // State
  const [sendToModalGameName , setSendToModalGameName] = useState(null);
  const [isUserHistoryOpen, setUserHistoryOpen]        = useState(false);
  const [historyUserId, setHistoryUserId]              = useState(null);

  const [chatListExtend, setChatListExtend] = useState(false);
  const [unreadCounts, setUnreadCounts]     = useState({});
  const [chatUserList, setChatUserList]     = useState([]);
  const [chatList, setChatList]             = useState([]);

  // 포털용 전역 드롭다운 
  const [menu, setMenu] = useState(null);

  // 커스텀훅
  useChatGetRooms(userData, setChatList);
  useUnReadChatCount(userData, chatList, setUnreadCounts);
  useNewChatNotice(userData, selectedRoom, setUnreadCounts);

  const getChatUserList = useChatGetUserList(setChatUserList);
  const deleteUserRoom  = useChatDeleteRoom();
  const getChatList     = useChatListGet();
  const setRead         = useSetReadUnReadChat(userData);

  // 아이콘
  function setGameIcon(gameName){
    switch(gameName) {
      case "overwatch":   return "/gameIcons/overwatch_Icon.png";
      case "lol":         return "/gameIcons/lol_Icon.png";
      case "dnf":         return "/gameIcons/dnf_Icon.png";
      case "maplestory":  return "/gameIcons/maplestory_Icon.png";
      case "lostark":     return "/gameIcons/lostark_Icon.png";
      default:            return "https://placehold.co/45";
    }
  }

  return (
    <div className='listRouteSize contentStyle'>

      {/* 전적 모달 */}
      {isUserHistoryOpen && (
        <UserHistoryModal
          sendToModalGameName={sendToModalGameName}
          setUserHistoryOpen={setUserHistoryOpen}
          historyUserId={historyUserId}
        />
      )}

      {/* 상단: 선택한 채팅방 카드 */}
      {selectedRoom && (
        <div className='selectCardStyle'>
          <div className='selectCardHeaderStyle'>
            <img src={setGameIcon(selectedRoom.gameName)} alt="방 아이콘" className="chatCardImage" />
            <p>{selectedRoom.name}</p>
            <p></p>
          </div>

          {/* 유저 리스트 확장 영역 */}
          {chatListExtend && (
            <div className='selectCardUserListStyle'>
              {chatUserList.map((item) => (
                <div key={item.userId} className='UserListContentStyle'>
                  <p>{item.userId}</p>

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
          )}

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
                unreadCounts[item.chatRoom.id] = 0;
              }}
            >
              <div className="chatCardHeader">
                <img src={setGameIcon(item.chatRoom.gameName)} alt="방 아이콘" className="chatCardImage" />
                <span className="chatCardTitle">{ item.chatRoom.name }</span>
                <span
                  className="chatCardDelete"
                  onClick={(e) => { e.stopPropagation(); deleteUserRoom(item.id); }}
                >
                  🗑
                </span>
              </div>

              {unread > 0 && (
                <div className="chatCardFooter">
                  <span className="chatCardBadge">{ unread }</span>
                  <span className="chatCardLastMessage">안읽은 메세지가 있습니다</span>
                </div>
              )}
            </div>
          );
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

            <p onClick={() => { console.log('간단 스펙 보기', menu.userId); 
            setSendToModalGameName(menu.gameName);
            setHistoryUserId(menu.userId);
            setUserHistoryOpen(true)
            setMenu(null); }}>
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
