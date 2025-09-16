import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import './routePage.css'


function SignUpRoutePage({ onSuccess }) {

  const navigate = useNavigate();

  // 유저 State
  // 유저 프로필 이미지는 추후 추가 예정
  const [user, setUser] = useState({
    userId: '',
    userPw: '',
    userName: '',
    userEmail: '',
  });

  // input 값 state 자동 적용
  function handleChange(e) {
    // 현재 입력중인 input의 id, value 가져옴
    const { id, value } = e.target;
    // User State 세팅
    setUser(prev => ({ ...prev, [id]: value}));
  }

  // 회원가입 
  function userJoin(e) {
    e.preventDefault();

    // Axios POST
    axios.post('/api/user/join', user)
      .then(response => {
        console.log(response.data);
        toast.success("회원가입이 성공적으로 완료되었습니다!");
        onSuccess?.(); 
      })
      .catch(error => {
        console.error(error);
      });
  }

  return (
    <div className='fullscreen LogRoutePageStyle'>
        <form className="login-form" onSubmit={ userJoin }>

        <input type="text" id="userId" placeholder="아이디" required
            value={user.userId} onChange={handleChange}/>

        <input type="password" id="userPw" placeholder="비밀번호" required
          value={user.userPw} onChange={handleChange}/>

        <input type="text" id="userName" placeholder="이름" required
         value={user.userName} onChange={handleChange}/>

        <input type="email" id="userEmail" placeholder="이메일" required
          value={user.userEmail} onChange={handleChange}/>

        <button type="submit">회원가입</button>
      </form>
    </div>
  )
}

export default SignUpRoutePage
