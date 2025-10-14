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
  const [user, setUser] = useState({
    userId: '',
    userPw: '',
    passwordConfirm: '', 
    userName: '',
    userEmail: '',
  });

  // 입력창의 내용이 바뀔 때마다 실행하는 함수 
  const handleChange = (e) => {
    const { id, value } = e.target;
    setUser(prev => ({ ...prev, [id]: value }));  //prev는 이전 상태를 의미, ...pev로 기존 값을 복사하고 현재 변경된 값만 덮어씌움
    
  };
  //폼 제출 때 실행되는 유효성 검사 
  const userJoin = (e) => {
    e.preventDefault();

    if (!user.userId || user.userId.length < 4 || user.userId.length > 20) {
      toast.warn('아이디는 4자 이상 20자 이하로 입력해주세요.');
      return;
    }

    const pwRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+=~`]).{8,16}$/;
    if (!pwRegex.test(user.userPw)) {
      toast.error('비밀번호는 8~16자, 대문자/특수문자를 각 1개 이상 포함해야 합니다.');
      return;
    }

    if (user.userPw !== user.passwordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (!user.userName.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.userEmail)) {
      toast.error('올바른 이메일 형식이 아닙니다.');
      return;
    }

    const { passwordConfirm, ...submissionData } = user;

    axios.post('/api/user/join', submissionData)
      .then(response => {
        toast.success("회원가입이 성공적으로 완료되었습니다!");
        setTimeout(() => {
          onSuccess?.(); 
        }, 1000);
      })
      .catch(error => {
        if (error.response && error.response.data) {
          toast.error(error.response.data);
        } else {
          toast.error("회원가입 중 오류가 발생했습니다.");
        }
        console.error(error);
      });
  };

  return (
    <div className='fullscreen LogRoutePageStyle'>
        <form className="login-form" onSubmit={ userJoin } noValidate>

        <input type="text" id="userId" placeholder="아이디(4자~20자)" required
            value={user.userId} onChange={handleChange}/>

        <input type="password" id="userPw" placeholder="비밀번호" required
          value={user.userPw} onChange={handleChange}/>
        
        <input type="password" id="passwordConfirm" placeholder="비밀번호 확인" required
          value={user.passwordConfirm} onChange={handleChange}/>

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
