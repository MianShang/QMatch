import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './searchPage.css';

// 로그인 체크용 Context API import
import { LogContext } from '../../App.jsx';

// custom hook import
import { useLoginCheck } from '../../hooks/login/useLoginCheck.js';

// Modal import
import CreateRoomModal from '../../modal/CreateRoomModal/CreateRoomModal.jsx';

function SearchPage() {
  const [name, setName] = useState('');
  const [rooms, setRooms] = useState([]);
  const [gameName, setGameName] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
 const [gametag, setGameTag] = useState('ALL');


  const { isLogIn, setIsLogIn, userData } = useContext(LogContext);
  useLoginCheck(isLogIn); // 로그인 체크

  // 처음 url에 입장할때 목록 가져오기 실행 및 채팅방 검색
  useEffect(() => {
     axios.get('/api/chat/rooms', {
      params: { keyword: searchKeyword }
    }).then((res) => setRooms(res.data));
  }, [searchKeyword]);

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


  //검색 카테고리 태그목록
  function chatTagRoom() {
  if (gametag === 'ALL') {
    return <p className="category-title">추천 카테고리</p>;
  }

  if (gametag === 'LOL') {
    return (
      <form className="tag-form">
        <div className="tag-section">
          <p className="tag-title">라인</p>
          <label><input type="checkbox" value="Top" /> 탑</label>
          <label><input type="checkbox" value="Jungle" /> 정글</label>
          <label><input type="checkbox" value="Mid" /> 미드</label>
          <label><input type="checkbox" value="AdCarry" /> 원딜</label>
          <label><input type="checkbox" value="Support" /> 서포터</label>
        </div>

        <div className="tag-section">
          <p className="tag-title">티어</p>
          <label><input type="checkbox" value="Bronze" /> 브론즈</label>
          <label><input type="checkbox" value="Silver" /> 실버</label>
          <label><input type="checkbox" value="Gold" /> 골드</label>
          <label><input type="checkbox" value="Platinum" /> 플레티넘</label>
          <label><input type="checkbox" value="Diamond" /> 다이아몬드</label>
        </div>
      </form>
    );
  }

  if (gametag === 'Maple') {
    return (
      <form className="tag-form">
        <div className="tag-section">
        <p className="tag-title">메이플 직업</p>
        <label><input type="checkbox" value="adel" /> 아델</label>
        <label><input type="checkbox" value="키네시스" /> 키네시스</label>
        </div>

        <div className="tag-section">
        <p className="tag-title">보스</p>
        <label><input type="checkbox" value="가디언 슬라임" /> 가디언 슬라임</label>
        <label><input type="checkbox" value="아무보스" /> 아무보스</label>
        <label><input type="checkbox" value="대충그냥 넣어" /> 대충그냥 넣어</label>
        </div>
      </form>
    );
  }

  if (gametag === 'Val') {
    return (
      <form className="tag-form">
        <div className="tag-section">
        <p className="tag-title">발로란트 태그</p>
        <label><input type="checkbox" value="발" /> 발</label>
        <label><input type="checkbox" value="로" /> 로</label>
        <label><input type="checkbox" value="란" /> 란</label>
        <label><input type="checkbox" value="트" /> 트</label>
        <label><input type="checkbox" value="대충그냥 넣어" /> 대충그냥 넣어</label>
        </div>
      </form>
    );
  }

  return null;
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

      <div className='fullscreen' style={{ display: "flex", padding: "10px" }}>
        {/* 좌측 사이드바 */}
        <div className='contentStyle leftSize'>
          {/* 여긴 카테고리
          <p>ID : {userData.userId}</p>
          <p>Name : {userData.userName}</p>
          <p>Email : {userData.userEmail}</p> */}

          <div className='Category_tag'>
                <button className='chat_tag' onClick={()=> setGameTag('LOL')}>
                  <img src="./public/gameIcons/lol_Icon.png" alt="LOL" />
                </button>

                <button className='chat_tag' onClick={()=> setGameTag('Maple')}>
                  <img src="./public/gameIcons/maplestory_Icon.png" alt="MapleStory" />
                </button>

                <button className='chat_tag' onClick={()=> setGameTag('Val')}>
                  <img src="./public/gameIcons/valorant_Icon.png" alt="Valorant"/>
                </button>

                <hr/>

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
                    onClick={() => { saveUserChatRoom(room.id); }}
                    style={{ color: "white", border: "1px solid", margin: "10px", height: "50px" }}>
                    <div>{room.name}</div>
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