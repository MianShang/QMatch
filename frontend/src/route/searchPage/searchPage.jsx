import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './searchPage.css';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaHome, FaSearch } from 'react-icons/fa';

// 로그인 체크용 Context API import
import { LogContext } from '../../App.jsx';
import JoinRoomModal from '../../modal/joinRoomModal/JoinRoomModal.jsx';

// custom hook import
import { useLoginCheck } from '../../hooks/login/useLoginCheck.js';
import { useChatGetRooms } from '../../hooks/chat/useChatGetRooms.js';

// Modal import
import CreateRoomModal from '../../modal/CreateRoomModal/CreateRoomModal.jsx';

function SearchPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [rooms, setRooms] = useState([]);
  const [gameName, setGameName] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showAlreadyJoinedModal, setShowAlreadyJoinedModal] = useState(false);
  const [alreadyJoinedRoom, setAlreadyJoinedRoom] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [gametag, setGameTag] = useState('ALL');
  const [selectedTags, setSelectedTags] = useState([]); // number[]
  const [groupedTags, setGroupedTags] = useState({});
  const [subscribedRooms, setSubscribedRooms] = useState([]);
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [panelGameTag, setPanelGameTag] = useState('ALL');

  const { isLogIn, setIsLogIn, userData, hasUnreadMessages, theme } = useContext(LogContext);
  useLoginCheck(isLogIn); // 로그인 체크

  // 본인이 구독한 채팅방 목록 가져오기
  useChatGetRooms(userData, setSubscribedRooms);

  // 디버깅용: subscribedRooms 상태 변화 확인
  useEffect(() => {
    console.log('subscribedRooms 업데이트:', subscribedRooms);
  }, [subscribedRooms]);

  // 게임 아이콘 설정 함수
  function setGameIcon(gameName) {
    switch (gameName) {
      case "overwatch": return "/gameIcons/overwatch_Icon.png";
      case "lol": return "/gameIcons/lol_Icon.png";
      case "dnf": return "/gameIcons/dnf_Icon.png";
      case "maplestory": return "/gameIcons/maplestory_Icon.png";
      case "lostark": return "/gameIcons/lostark_Icon.png";
      case "tft": return "/gameIcons/tft_Icon.png";
      case "valorant": return "/gameIcons/valorant_Icon.png";
      default: return "https://placehold.co/45";
    }
  }

  // 태그 패널 토글 (같은 게임이면 닫기, 다른 게임이면 열기)
  function handleToggleTagPanel(gameTag) {
    if (gameTag === 'ALL') {
      // 전체 게임은 패널을 열지 않고 필터만 적용
      setGameTag(gameTag);
      setSelectedTags([]);
      setShowTagPanel(false);
    } else if (showTagPanel && panelGameTag === gameTag) {
      // 같은 게임이면 닫기
      setShowTagPanel(false);
    } else {
      // 다른 게임이면 열기
      setPanelGameTag(gameTag);
      setGameTag(gameTag);
      setSelectedTags([]); // 패널 열 때 태그 초기화
      setShowTagPanel(true);
    }
  }

  // 태그 패널 닫기
  function handleCloseTagPanel() {
    setShowTagPanel(false);
  }

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event) {
      const panel = document.querySelector('.tag-panel-overlay');
      const triggerButtons = document.querySelectorAll('.chat_tag');
      
      if (showTagPanel) {
        let clickedInsidePanel = false;
        let clickedOnTrigger = false;
        
        // 패널 내부 클릭 확인
        if (panel && panel.contains(event.target)) {
          clickedInsidePanel = true;
        }
        
        // 버튼 클릭 확인
        triggerButtons.forEach(btn => {
          if (btn.contains(event.target)) {
            clickedOnTrigger = true;
          }
        });
        
        // 패널 외부 클릭이고 버튼도 아니면 패널 닫기
        if (!clickedInsidePanel && !clickedOnTrigger) {
          setShowTagPanel(false);
        }
      }
    }

    if (showTagPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTagPanel]);

  // 처음 url에 입장할때 목록 가져오기 실행 및 채팅방 검색
  useEffect(() => {
    const params = new URLSearchParams();

    ///params: {} 는 배열상태로 springboot에 전송 불가 직접 개체를 만들고 전송
    if (searchKeyword) params.append('keyword', searchKeyword);
    if (gametag) params.append('gametag', gametag);
    if (selectedTags.length > 0) {
      selectedTags.forEach(tag => {
        params.append('tags', tag);
      });
    }

    axios.get('/api/chat/rooms', { params })
      .then((res) => setRooms(res.data))
      .catch((err) => console.error("검색 실패:", err));
  }, [searchKeyword, gametag, selectedTags]);

  // 방 입장 모달에서 "입장 신청" 버튼 클릭 시 실행
  async function handleJoinRoom(payload) {
    const { roomId, chatName, gameName, tagNames, joinType } = payload || {};
    
    if (!roomId) {
      console.error('room id 없음:', payload);
      setJoinOpen(false);
      setSelectedRoom(null);
      return;
    }

    // 해당 게임의 게임 코드가 있는지 확인
    try {
      const gameCodeResponse = await axios.get("/api/get/user/gamecode", {
        params: { userId: userData.userId }
      });
      const gameCodes = gameCodeResponse.data || [];
      const hasGameCode = gameCodes.some(code => code.gameName === gameName);
      
      if (!hasGameCode) {
        const gameNameMap = {
          'lol': '롤',
          'maplestory': '메이플스토리',
          'lostark': '로스트아크',
          'tft': 'TFT',
          'dnf': '던전앤파이터'
        };
        const gameDisplayName = gameNameMap[gameName] || gameName;
        toast.error(`${gameDisplayName} 게임 코드를 먼저 등록해주세요.`);
        setJoinOpen(false);
        setSelectedRoom(null);
        return;
      }
    } catch (err) {
      console.error("게임 코드 확인 실패:", err);
      toast.error("게임 코드 확인 중 오류가 발생했습니다.");
      setJoinOpen(false);
      setSelectedRoom(null);
      return;
    }

    try {
      // 자유 입장 방인지 확인
      if (joinType === 'free') {
        // 자유 입장 API 호출
        const response = await axios.post(`/api/chat/rooms/${roomId}/join`, {
          userId: userData.userId
        });

        if (response.status === 200) {
          // 자유 입장 성공 - 바로 채팅방으로 이동
          toast.success('채팅방에 입장했습니다!');
          // 입장한 본인에게도 즉시 입장 메시지 추가
          const userName = userData.userName || userData.userId;
          const joinMessage = {
            name: "MEMBER_JOIN",
            userName: "MEMBER_JOIN", 
            message: `${userName}님이 입장했습니다. \n 모두 환영해주세요~~`,
            chatDate: new Date().toISOString()
          };
          // 전역 상태에 임시 저장 (lobbyPage에서 사용)
          sessionStorage.setItem('pendingJoinMessage', JSON.stringify(joinMessage));
          navigate('/', { 
            state: { 
              type: 'multi', // 다대다 채팅방 타입 추가
              roomId: roomId,
              chatName: chatName,
              gameName: gameName,
              tagNames: tagNames || [],
              joinType: joinType
            }
          });
          setJoinOpen(false);
          setSelectedRoom(null);
        }
      } else {
        // 방장 승인 방 - 입장 신청 API 호출
        const response = await axios.post(`/api/chat/rooms/${roomId}/join-request`, {
          userId: userData.userId
        });

        if (response.data.status === 'PENDING') {
          // 입장 신청 성공 - 토스트 메시지 표시
          toast.info('입장 신청이 전송되었습니다. 방장의 승인을 기다려주세요.');
          setJoinOpen(false);
          setSelectedRoom(null);
        }
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        toast.warning('이미 입장 신청을 했습니다.');
      } else if (status === 404) {
        toast.error('채팅방을 찾을 수 없습니다.');
      } else if (status === 403) {
        toast.error('채팅방이 가득 찼습니다.');
      } else {
        toast.error('입장에 실패했습니다. 다시 시도해주세요.');
      }
      return; // 실패 시 모달 안 닫음
    }
  }

  // 게임태그 바뀔 때마다 태그 초기화
  useEffect(() => {
    setSelectedTags([]);
  }, [gametag]);

  // 필터링된 채팅방 개수 가져오기
  const filteredRooms = getFilteredRooms();
  const resultCount = filteredRooms.length;

  ///임시
  useEffect(() => {
    if (!gametag) return;

  fetch(`/api/tags/${gametag}`)
      .then(res => res.json())
      .then(data => {
        //console.log('태그 응답 데이터:', data);
        const grouped = data.reduce((acc, tag) => {
          const category = tag.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(tag);
          return acc;
        }, {});
        
        setGroupedTags(grouped); // { line: [...], tier: [...] }
      })
      .catch(err => console.error(err));
  }, [gametag]);


  function handleTagChange(e) {
    const id = Number(e.target.value);   // ← 숫자로 강제
    const checked = e.target.checked;

    setSelectedTags(prev =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) // 중복 방지
              : prev.filter(x => x !== id)
    );
  }

  // 구독한 채팅방을 제외하고 필터링하는 함수
  function getFilteredRooms() {
    if (!subscribedRooms || subscribedRooms.length === 0) {
      return rooms; // 구독한 방이 없으면 모든 방 반환
    }
    
    // subscribedRooms는 { chatRoom: { id: ... } } 구조
    const subscribedRoomIds = subscribedRooms.map(room => room.chatRoom.id);
    
    const filtered = rooms.filter(room => !subscribedRoomIds.includes(room.id));
    
    return filtered;
  }


  function chatTagRoom() {  
    if (!groupedTags || Object.keys(groupedTags).length === 0) {
      return (
        <div className="tag-empty-state">
          <div className="tag-empty-icon">🏷️</div>
          <div className="tag-empty-message">
            태그를 불러오는 중...
          </div>
        </div>
      );
    }

    return (
      <div className="tag-form">
        {Object.keys(groupedTags).map(category => (
          <div key={category} className="tag-section">
            <p className="tag-title">{category}</p>
            <div className="tag-list">
              {groupedTags[category].map(tag => (
                <label 
                  key={tag.id}
                  className={`tag-item ${selectedTags.includes(Number(tag.id)) ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    value={tag.id}
                    checked={selectedTags.includes(Number(tag.id))}
                    onChange={handleTagChange}
                    className="tag-checkbox"
                  />
                  <span className="tag-name">{tag.tagName}</span>
                </label> 
              ))}
            </div>
          </div> 
        ))}
      </div>
    );
  }

  // 이미 입장한 방 확인 모달 관련 함수들
  function handleCancelMoveToRoom() {
    setShowAlreadyJoinedModal(false);
    setAlreadyJoinedRoom(null);
  }

  function handleMoveToAlreadyJoinedRoom() {
    if (alreadyJoinedRoom) {
      navigate('/', { 
        state: { 
          type: 'multi', // 다대다 채팅방 타입 추가
          roomId: alreadyJoinedRoom.id,
          chatName: alreadyJoinedRoom.chatName || alreadyJoinedRoom.name,
          gameName: alreadyJoinedRoom.gameName,
          tagNames: alreadyJoinedRoom.tagNames || [],
          currentUsers: alreadyJoinedRoom.currentUsers,
          maxUsers: alreadyJoinedRoom.maxUsers,
          hostUserId: alreadyJoinedRoom.hostUserId
        }
      });
    }
    setShowAlreadyJoinedModal(false);
    setAlreadyJoinedRoom(null);
  }

  return (
    <>
      {openModal && (
        <CreateRoomModal
          setOpenModal={setOpenModal}
          onRoomCreated={(newRoom) => {
            setRooms(prev => [...prev, newRoom]);
            // 방장은 모든 방에서 자동으로 입장 (자유 입장 방과 방장 승인 방 모두)
            navigate('/', { 
              state: { 
                type: 'multi', // 다대다 채팅방 타입 추가
                roomId: newRoom.id,
                chatName: newRoom.chatName || newRoom.name,
                gameName: newRoom.gameName,
                tagNames: newRoom.tagNames || [],
                currentUsers: newRoom.currentUsers,
                maxUsers: newRoom.maxUsers,
                hostUserId: newRoom.hostUserId,
                joinType: newRoom.joinType
              }
            });
          }}
        />
      )}

      {/* 방 입장 모달 */}
      {joinOpen && (
        <JoinRoomModal
          open={joinOpen}
          onClose={function () { setJoinOpen(false); setSelectedRoom(null); }}
          room={selectedRoom}
          onJoin={handleJoinRoom}
        />
      )}

      {/* 이미 입장한 방 확인 모달 */}
      {showAlreadyJoinedModal && (
        <div className="modalOverlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: theme === 'light' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modalContent" style={{
            background: 'var(--discord-bg-primary)',
            borderRadius: 'var(--discord-radius)',
            width: '400px',
            padding: '24px',
            boxShadow: 'var(--discord-elevation-high)',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--discord-bg-tertiary)',
            color: 'var(--discord-text-normal)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>
              이미 참여 중인 방입니다
            </h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--discord-text-muted)' }}>
              "{alreadyJoinedRoom?.chatName}" 방에 이미 참여 중입니다.<br/>
              해당 방으로 이동하시겠습니까?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelMoveToRoom}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: 'var(--discord-radius-small)',
                  background: 'var(--discord-bg-tertiary)',
                  color: 'var(--discord-text-normal)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                취소
              </button>
              <button
                onClick={handleMoveToAlreadyJoinedRoom}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: 'var(--discord-radius-small)',
                  background: 'var(--discord-accent)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                이동하기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`fullscreen cosmic-background ${showTagPanel ? 'has-tag-panel' : ''}`} style={{ display: "flex", padding: "0" }}>

        {/* 좌측 사이드바 */}
        <div className='contentStyle leftSize'>
          {/* 여긴 카테고리 */}
          <p>검색 태그</p>
          <div className='Category_tag'>
                <button className={`chat_tag ${gametag === 'ALL' ? 'active' : ''}`} onClick={()=> handleToggleTagPanel('ALL')}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>ALL</div>
                  <p>전체 게임</p>
                </button>

                <button className={`chat_tag ${gametag === 'lol' ? 'active' : ''}`} onClick={()=> handleToggleTagPanel('lol')}>
                  <img src="./public/gameIcons/lol_Icon.png" alt="LOL" />
                  <p>League of Legends</p>
                </button>

                <button className={`chat_tag ${gametag === 'tft' ? 'active' : ''}`} onClick={()=> handleToggleTagPanel('tft')}>
                  <img src="./public/gameIcons/tft_Icon.png" alt="TFT"/>
                  <p>Teamfight Tactics</p>
                </button>

                <button className={`chat_tag ${gametag === 'maplestory' ? 'active' : ''}`} onClick={()=> handleToggleTagPanel('maplestory')}>
                  <img src="./public/gameIcons/maplestory_Icon.png" alt="MapleStory" />
                  <p>MapleStory</p>
                </button>

                <button className={`chat_tag ${gametag === 'dnf' ? 'active' : ''}`} onClick={()=> handleToggleTagPanel('dnf')}>
                  <img src="./public/gameIcons/dnf_Icon.png" alt="Dnf"/>
                  <p>던전앤파이터</p>
                </button>

                <button className={`chat_tag ${gametag === 'lostark' ? 'active' : ''}`} onClick={()=> handleToggleTagPanel('lostark')}>
                  <img src="./public/gameIcons/lostark_Icon.png" alt="lostark"/>
                  <p>로스트아크</p>
                </button>
            </div>


        </div>

        {/* 우측 사이드바 */}
        <div className='rightSize'>
          {/* 검색 바 */}
          <div className='contentStyle searchBarSize'>
            <div className="searchBarContainer">
              <FaSearch className="searchIcon" />
              <input
                type="text"
                placeholder="방 이름으로 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="searchInput"
              />
            </div>
          </div>

          {/* 채팅방 리스트 */}
          <div className='contentStyle chatListSize'>
            <div className='chatListScroll'>
              {resultCount === 0 ? (
                <div className='empty-state'>
                  <div className='empty-state-icon'>🔍</div>
                  <div className='empty-state-title'>채팅방을 찾을 수 없습니다</div>
                  <div className='empty-state-message'>
                    다른 검색 키워드를 입력하거나 필터를 변경해보세요.<br/>
                    또는 새로운 채팅방을 만들어보세요!
                  </div>
                </div>
              ) : (
                getFilteredRooms().map((room) => (
                  <div className='chatRoomList'
                    key={room.id}
                    onClick={() => { setSelectedRoom(room); setJoinOpen(true); }}>
                    <img 
                      src={setGameIcon(room.gameName)} 
                      alt="게임 아이콘" 
                      className="chatRoomIcon"
                    />
                    <div className="chatRoomInfo">
                      <div className="chatRoomName">{room.chatName || room.name}</div>
                      <div className="chatRoomUsers">
                        <span>{room.currentUsers || 0}</span> / {room.maxUsers || 100}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 채팅방 생성 */}
            <div className='chatCreate'>
              <button onClick={() => setOpenModal(true)}>방 만들기</button>
            </div>
          </div>

          {/* 하단 광고 및 알림바 */}
          <div className='bottomSize'>
            <div className='searchAdSize'>
              <span style={{ color: 'var(--discord-text-muted)', fontSize: '14px' }}>
                QMatch - 게임 팀원 모집 플랫폼
              </span>
            </div>

            <Link to="/">
              <div className='noticeSize' style={{ position: 'relative' }}>
                <FaHome className='home-icon' />
                {hasUnreadMessages && (
                  <div className="unread-notification-badge">
                    <span className="unread-dot"></span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* 태그 패널 오버레이 */}
        {showTagPanel && (
          <div className="tag-panel-overlay">
            <div className="tag-panel-content">
              <div className="tag-panel-header">
                <span>필터 태그</span>
                <button className="tag-panel-close-btn" onClick={handleCloseTagPanel}>
                  ×
                </button>
              </div>
              
              <div className="tag-panel-body">
                {chatTagRoom()}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SearchPage;