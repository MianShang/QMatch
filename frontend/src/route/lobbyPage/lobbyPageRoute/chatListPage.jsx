import { useState, useContext, useEffect, useRef } from 'react';
import './list.css';
import { Client } from '@stomp/stompjs';

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

  // 멤버인지 방장인지 구분
  const [ownerUserId, setOwnerUserId] = useState(null);

  /* 참여자 패널 열림/좌표 상태 및 참조 */
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [panelRect, setPanelRect] = useState({ left: 0, top: 0, height: 0 });
  const leftColRef = useRef(null);

  // 음량 표시
  const [voiceParticipants, setVoiceParticipants] = useState(false)
  const [speakers, setSpeakers] = useState({});
  const [localMuted, setLocalMuted] = useState(false);
  const [joinedVoice, setJoinedVoice] = useState(false);

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
      case "tft": return "/gameIcons/tft_Icon.png";
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

  /* 방장 ID 가져오기 */
  useEffect(() => {
    if (!selectedRoom?.id) return;
    (async () => {
      try {
        const res = await fetch(`/api/chat/rooms/${selectedRoom.id}`);
        if (!res.ok) throw new Error('room detail fetch failed');
        const data = await res.json();
        setOwnerUserId(data.hostUserId ?? data.ownerUserId ?? null);
      } catch (e) {
        console.warn('방 상세 조회 실패:', e);
        setOwnerUserId(null);
      }
    })();
  }, [selectedRoom?.id]);

  /* 강퇴 + 방장 변경 이벤트 */
  useEffect(() => {
    if (!selectedRoom?.id || !userData?.userId) return;

    const stomp = new Client({
      brokerURL: 'ws://localhost:8080/gs-guide-websocket',
      reconnectDelay: 5000,
      connectHeaders: {
        userId: userData.userId,
        roomId: selectedRoom.id,
      },
    });

    stomp.onConnect = () => {
      // 강퇴 이벤트
      stomp.subscribe(`/topic/chat/${selectedRoom.id}/kick`, (frame) => {
        try {
          const payload = JSON.parse(frame.body);

          if (payload?.targetUserId === userData.userId) {
            // 내가 추방된 경우
            setSelectedRoom(null);
            setMessages?.([]);
            setIsMembersOpen(false);
            setChatList(prev => prev.filter(it => it.chatRoom.id !== payload.roomId));
            setUnreadCounts(prev => {
              const next = { ...prev };
              delete next[payload.roomId];
              return next;
            });
            alert('방장에게 의해 방에서 추방되었습니다.');
          } else {
            // 다른 사람 추방 시 참여자 목록 갱신
            setChatUserList(prev => prev.filter(u => u.userId !== payload?.targetUserId));
          }
        } catch (e) {
          console.error('kick payload parse error', e);
        }
      });

      // 방장 변경 이벤트
      stomp.subscribe(`/topic/chat/${selectedRoom.id}/host-transfer`, (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          console.log("방장 변경 이벤트:", payload);

          setOwnerUserId(payload.newHost);

          if (payload.newHost === userData.userId) {
            alert("당신이 새로운 방장이 되었습니다!");
          }
          if (payload.oldHost === userData.userId) {
            alert("방장을 넘겼습니다.");
          }
        } catch (e) {
          console.error("host-transfer parse error", e);
        }
      });
    };

    stomp.activate();
    return () => stomp.deactivate();
  }, [selectedRoom?.id, userData?.userId]);

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
              {chatUserList.map((item) => {
                const key = String(item.userId); // 문자열 키 권장
                const info = speakers[key] || { level: 0, speaking: false };
                const isMe = item.userId === userData.userId;

                const isVoiceParticipant = Array.isArray(voiceParticipants)&&voiceParticipants.includes(String(item.userId));
                const talkingOn = isVoiceParticipant && info.speaking && !(isMe && localMuted);

                return (                
                  <div key={item.userId} className='UserListContentStyle'>
                    <p>
                      {item.userId}
                      {/* 말하는 중 표시 */}
                      {isVoiceParticipant && (
                      <span
                        className={`talkSpeakerArc ${talkingOn ? 'on' : ''}`}
                        aria-label={talkingOn ? '말하는 중' : '말하지 않음'}
                      >
                        <svg className="icon" viewBox="0 0 64 32" aria-hidden="true">
                          {/* 스피커 본체 */}
                          <path className="spk" d="M6 12v8h8l10 8V4L14 12H6z" />
                          {/* 반원 파동 3개 (오른쪽으로 퍼짐) */}
                          <path className="wave w1" d="M30 8a8 8 0 0 1 0 16" />
                          <path className="wave w2" d="M36 5a12 12 0 0 1 0 22" />
                          <path className="wave w3" d="M42 2a16 16 0 0 1 0 28" />
                        </svg>
                      </span>
                      )}
                    </p>

                    {/* 음성채팅 버튼 */}
                    {isMe && selectedRoom && (
                      <VoiceChat
                        channelName={selectedRoom.id}
                        uid={userData.userId}
                        onSpeakers={setSpeakers}
                        onLocalMuteChange={setLocalMuted}
                        onJoinChange={setJoinedVoice}
                        onVoiceParticipantsChange={setVoiceParticipants}
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
                );
              })}
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

            {(ownerUserId === userData.userId) && (menu.userId !== userData.userId) && (
              <p onClick={async () => {
                try {
                  await fetch(`/api/chat/rooms/${selectedRoom.id}/kick`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      targetUserId: menu.userId,
                      requesterUserId: userData.userId   // 방장 신원 전달(서버 권한 체크용)
                    })
                  });
                  console.log('강퇴 성공:', menu.userId);
                } catch (err) {
                  console.error('강퇴 실패:', err);
                }
                setMenu(null);
              }}>
                강퇴하기
              </p> 
            )}

            {(ownerUserId === userData.userId) && (menu.userId !== userData.userId) && (
              <p onClick={async () => {
                try {
                  await fetch(`/api/chat/rooms/${selectedRoom.id}/transfer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fromUserId: userData.userId,
                      toUserId: menu.userId
                    })
                  });
                  // 상태는 이벤트 브로드캐스트로 자동 반영됨
                } catch (err) {
                  console.error('방장 넘기기 실패:', err);
                  alert('방장 넘기기에 실패했습니다.');
                }
                setMenu(null);
              }}>
                방장 넘기기
              </p>
            )}

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