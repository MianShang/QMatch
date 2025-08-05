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
  const [selectedTags,setSelectedTags] = useState('');


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

  // 기존 url에 입장할때 목록 가져오기 실행 및 채팅방 검색 코드 
  // 에러날시 아래 기존코드 사용할 것
    /* axios.get('/api/chat/rooms', {
      params: {
        keyword: searchKeyword,
        gametag: gametag,
        tags: selectedTags
      }
    }).then(res => setRooms(res.data));
  }, [gametag, selectedTags, searchKeyword]); */


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

  function chatTagRoom() 
  {
  function handleTagChange(e) {
    const value = e.target.value;
    setSelectedTags((prev) =>
      e.target.checked ? [...prev, value] : prev.filter((v) => v !== value)
    );
  }

  const renderTags = (title, values) => (
    <div className="tag-section">
      <p className="tag-title">{title}</p>
      {values.map((tag) => (
        <label key={tag.value}>
          <input
            type="checkbox"
            value={tag.value}
            onChange={handleTagChange}
            checked={selectedTags.includes(tag.value)}
          />{" "}
          {tag.label}
        </label>
      ))}
    </div>
  );

  switch (gametag) {
    case "ALL":
      return (
        <form className="tag-form">
          {renderTags("추천 카테고리", [
            { value: "5인큐", label: "5인큐" },
            { value: "자유랭크", label: "자유랭크" },
            { value: "듀오", label: "듀오" },
            { value: "솔로랭크", label: "솔로랭크" },
          ])}
        </form>
      );

    case "lol":
      return (
        <form className="tag-form">
          {renderTags("라인", [
            { value: "탑", label: "탑" },
            { value: "정글", label: "정글" },
            { value: "미드", label: "미드" },
            { value: "원딜", label: "원딜" },
            { value: "서포터", label: "서포터" },
          ])}
          {renderTags("티어", [
            { value: "브론즈", label: "브론즈" },
            { value: "실버", label: "실버" },
            { value: "골드", label: "골드" },
            { value: "플레티넘", label: "플레티넘" },
            { value: "다이아몬드", label: "다이아몬드" },
            { value: "마스터", label: "마스터" },
            { value: "그랜드마스터", label: "그랜드마스터" },
            { value: "챌린저", label: "챌린저" },
          ])}
        </form>
      );

    case "maplestory":
      return (
        <form className="tag-form">
          {renderTags("메이플", [{ value: "일일숙제", label: "일일숙제" }])}
        </form>
      );

    case "val":
      return (
        <form className="tag-form">
          {renderTags("발로란트 태그", [
            { value: "발", label: "발" },
            { value: "로", label: "로" },
            { value: "란", label: "란" },
            { value: "트", label: "트" },
            { value: "대충그냥 넣어", label: "대충그냥 넣어" },
          ])}
        </form>
      );

    case "dnf":
      return (
        <form className="tag-form">
          {renderTags("던파 태그", [
            { value: "발", label: "발" },
            { value: "로", label: "로" },
            { value: "란", label: "란" },
            { value: "트", label: "트" },
            { value: "대충그냥 넣어", label: "대충그냥 넣어" },
          ])}
        </form>
      );

    case "lostark":
      return (
        <form className="tag-form">
          {renderTags("로스트아크 태그", [
            { value: "로", label: "로" },
            { value: "스", label: "스" },
            { value: "트", label: "트" },
            { value: "아", label: "아" },
            { value: "크", label: "크" },
          ])}
        </form>
      );

    default:
      return null;
  }
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
                  <img src="./public/gameIcons/lostark_Icon.png" alt="Valorant"/>
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