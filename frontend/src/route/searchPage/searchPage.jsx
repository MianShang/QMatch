import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './searchPage.css';
import { useNavigate } from 'react-router-dom';

// 로그인 체크용 Context API import
import { LogContext } from '../../App.jsx';
import JoinRoomModal from '../../modal/joinRoomModal/JoinRoomModal.jsx';

// custom hook import
import { useLoginCheck } from '../../hooks/login/useLoginCheck.js';

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
  const [searchKeyword, setSearchKeyword] = useState('');
  const [gametag, setGameTag] = useState('ALL');
  const [selectedTags, setSelectedTags] = useState([]); // number[]
  const [groupedTags, setGroupedTags] = useState({});



  const { isLogIn, setIsLogIn, userData } = useContext(LogContext);
  useLoginCheck(isLogIn); // 로그인 체크

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

  // 방 입장 모달에서 "입장하기" 버튼 클릭 시 실행
  function handleJoinRoom(payload) {
    const { roomId, chatName, gameName, tagNames } = payload || {};
    if (!roomId) {
      console.error('room id 없음:', payload);
      setJoinOpen(false);
      setSelectedRoom(null);
      return;
    }

    // 서버에 유저-채팅방 매핑 저장
    saveUserChatRoom(roomId);

    // 채팅 화면으로 라우팅
    navigate('/', { state: { roomId, chatName, gameName, tagNames } });

    setJoinOpen(false);
    setSelectedRoom(null);
  }

  function saveUserChatRoom(roomId) {
    axios.post('/api/add/user/chatroom', {
      userId: userData.userId,
      roomId: roomId
    })
    .then(() => {
      console.log("성공");
    })
    .catch((err) => console.error('저장 실패', err));
  }

   // 게임태그 바뀔 때마다 태그 초기화
  useEffect(() => {
    setSelectedTags([]);
  }, [gametag]);

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


function chatTagRoom() {  
  if (!groupedTags || Object.keys(groupedTags).length === 0) {
    return null; // 아무것도 렌더링하지 않음
  }

  return (
    <form className="tag-form">
      {Object.keys(groupedTags).map(category => (
        <div key={category} className="tag-section">
        <p className="tag-title">{category}</p>
        {groupedTags[category].map(tag => (
          <label key={tag.id}>
            <input
              type="checkbox"
              value={tag.id}
              checked={selectedTags.includes(Number(tag.id))}
              onChange={handleTagChange} />
              {" "}
              {tag.tagName}
          </label> ))}
        </div> ))}
    </form>
  );
}


  return (
    <>
      {openModal && (
        <CreateRoomModal
          setOpenModal={setOpenModal}
          onRoomCreated={(newRoom) => {
            setRooms(prev => [...prev, newRoom]);
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

      <div className='fullscreen' style={{ display: "flex", padding: "10px" }}>
        {/* 좌측 사이드바 */}
        <div className='contentStyle leftSize'>
          {/* 여긴 카테고리 */}
          <p style={{color:"white", fontSize:"20px", margin:"3px"}}>검색 태그</p>
          <div className='Category_tag'>
                <button className='chat_tag' onClick={()=> setGameTag('ALL')}>
                  <p style={{color:"white", fontSize:"30px"}}>ALL</p>
                </button>

                <button className='chat_tag' onClick={()=> setGameTag('lol')}>
                  <img src="./public/gameIcons/lol_Icon.png" alt="LOL" />
                </button>

                <button className='chat_tag' onClick={()=> setGameTag('maplestory')}>
                  <img src="./public/gameIcons/maplestory_Icon.png" alt="MapleStory" />
                </button>

                <button className='chat_tag' onClick={()=> setGameTag('val')}>
                  <img src="./public/gameIcons/valorant_Icon.png" alt="Valorant"/>
                </button>

                <button className='chat_tag' onClick={()=> setGameTag('dnf')}>
                  <img src="./public/gameIcons/dnf_Icon.png" alt="Dnf"/>
                </button>

                <button className='chat_tag' onClick={()=> setGameTag('lostark')}>
                  <img src="./public/gameIcons/lostark_Icon.png" alt="lostark"/>
                </button>

                <hr style={{width:"280px", margin:"3px"}}></hr>

                {/* 태그 목록 */}
                {chatTagRoom()}
            </div>


        </div>

        {/* 우측 사이드바 */}
        <div className='rightSize'>
          {/* 검색 바 */}
          <div className='contentStyle searchBarSize'>
            <input
              type="text"
              placeholder="방 이름 검색"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="searchInput"
            />
          </div>

          {/* 채팅방 리스트 */}
          <div className='contentStyle chatListSize'>
            <div className='chatListScroll'>
              채팅 리스트
              {
                rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => { setSelectedRoom(room); setJoinOpen(true); }}
                    style={{ color: "white", border: "1px solid", margin: "10px", height: "50px" }}>
                    <div>{room.chatName || room.name}</div>
                  </div>
                ))
              }
            </div>

            {/* 채팅방 생성 */}
            <div className='chatCreate'>
              <button onClick={() => setOpenModal(true)}>방 만들기</button>
            </div>
          </div>

          {/* 하단 광고 및 알림바 */}
          <div className='bottomSize' style={{ display: "flex" }}>
            <div className='contentStyle searchAdSize'>
              광고든 뭐든 그거
            </div>

            <Link to="/">
              <div className='contentStyle noticeSize'>
                <img src="/MessageIcon.png" className='imgPos' alt="알림" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default SearchPage;