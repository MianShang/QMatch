import { useState, useEffect, useRef } from 'react'
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
    userAge: '',
    userPhone: '',
  });

  // 아이디 중복 검사 상태
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [isIdAvailable, setIsIdAvailable] = useState(false);
  
  // 이메일 인증 상태
  const [emailCode, setEmailCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const isSendingEmailRef = useRef(false); // 중복 클릭 방지를 위한 ref

  // 입력창의 내용이 바뀔 때마다 실행하는 함수 
  const handleChange = (e) => {
    const { id, value } = e.target;
    setUser(prev => ({ ...prev, [id]: value }));  //prev는 이전 상태를 의미, ...pev로 기존 값을 복사하고 현재 변경된 값만 덮어씌움
    
    // 아이디가 변경되면 중복 검사 상태 초기화
    if (id === 'userId') {
      setIsIdChecked(false);
      setIsIdAvailable(false);
    }
  };

  // 아이디 중복 검사
  const checkUserId = async () => {
    if (!user.userId || user.userId.length < 4 || user.userId.length > 20) {
      toast.warn('아이디는 4자 이상 20자 이하로 입력해주세요.');
      return;
    }

    try {
      const response = await axios.get('/api/user/check-id', {
        params: { userId: user.userId }
      });
      setIsIdChecked(true);
      setIsIdAvailable(true);
      toast.success(response.data);
    } catch (error) {
      setIsIdChecked(true);
      setIsIdAvailable(false);
      if (error.response && error.response.data) {
        toast.error(error.response.data);
      } else {
        toast.error("아이디 중복 검사 중 오류가 발생했습니다.");
      }
    }
  };

  // 이메일 인증 코드 발송
  const sendEmailVerification = async () => {
    // 중복 발송 방지 (즉시 체크 및 설정)
    if (isSendingEmailRef.current || isSendingEmail || (isEmailCodeSent && emailTimer > 0)) {
      return;
    }

    // 즉시 ref 설정하여 중복 요청 차단
    isSendingEmailRef.current = true;
    setIsSendingEmail(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.userEmail)) {
      isSendingEmailRef.current = false;
      setIsSendingEmail(false);
      toast.error('올바른 이메일 형식이 아닙니다.');
      return;
    }

    try {
      await axios.post('/api/user/send-email-verification', null, {
        params: { email: user.userEmail }
      });
      setIsEmailCodeSent(true);
      setEmailTimer(300); // 5분 타이머
      toast.success('인증 코드가 발송되었습니다.');
      
      // 타이머 시작
      const timerInterval = setInterval(() => {
        setEmailTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data);
      } else {
        toast.error("이메일 발송 중 오류가 발생했습니다.");
      }
    } finally {
      isSendingEmailRef.current = false;
      setIsSendingEmail(false);
    }
  };

  // 이메일 인증 코드 검증
  const verifyEmailCode = async () => {
    if (!emailCode) {
      toast.error('인증 코드를 입력해주세요.');
      return;
    }

    try {
      await axios.post('/api/user/verify-email', null, {
        params: { 
          email: user.userEmail,
          code: emailCode
        }
      });
      setIsEmailVerified(true);
      toast.success('이메일 인증이 완료되었습니다.');
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data);
      } else {
        toast.error("인증 코드 검증 중 오류가 발생했습니다.");
      }
    }
  };
  //폼 제출 때 실행되는 유효성 검사 
  const userJoin = (e) => {
    e.preventDefault();

    if (!user.userId || user.userId.length < 4 || user.userId.length > 20) {
      toast.warn('아이디는 4자 이상 20자 이하로 입력해주세요.');
      return;
    }

    if (!isIdChecked || !isIdAvailable) {
      toast.warn('아이디 중복 검사를 해주세요.');
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

    if (!isEmailVerified) {
      toast.warn('이메일 인증을 완료해주세요.');
      return;
    }

    if (!user.userAge || parseInt(user.userAge) < 1 || parseInt(user.userAge) > 150) {
      toast.error('올바른 나이를 입력해주세요.');
      return;
    }

    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(user.userPhone)) {
      toast.error('올바른 휴대폰번호 형식이 아닙니다. (예: 010-1234-5678)');
      return;
    }

    const { passwordConfirm, ...submissionData } = user;
    submissionData.userAge = parseInt(submissionData.userAge);

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

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='fullscreen LogRoutePageStyle'>
        <form className="login-form" onSubmit={ userJoin } noValidate>

        <div className="input-with-button">
          <input type="text" id="userId" placeholder="아이디(4자~20자)" required
              value={user.userId} onChange={handleChange}
              className={isIdChecked ? (isIdAvailable ? 'valid' : 'invalid') : ''}/>
          <button type="button" onClick={checkUserId} className="check-button">
            중복확인
          </button>
        </div>  
        {isIdChecked && (
          <div className={`validation-message ${isIdAvailable ? 'success' : 'error'}`}>
            {isIdAvailable ? '✓ 사용 가능한 아이디입니다.' : '✗ 이미 사용 중인 아이디입니다.'}
          </div>
        )}

        <input type="password" id="userPw" placeholder="비밀번호" required
          value={user.userPw} onChange={handleChange}/>
        <p className="password-guideline">
           8~16자, 대문자/특수문자를 각 1개 이상 포함
        </p>
        
        <input type="password" id="passwordConfirm" placeholder="비밀번호 확인" required
          value={user.passwordConfirm} onChange={handleChange}/>

        <input type="text" id="userName" placeholder="이름" required
         value={user.userName} onChange={handleChange}/>

        <div className="input-with-button">
          <input type="email" id="userEmail" placeholder="이메일" required
            value={user.userEmail} onChange={handleChange}
            className={isEmailVerified ? 'valid' : ''}/>
          <button type="button" onClick={sendEmailVerification} className="check-button" disabled={isSendingEmail || (isEmailCodeSent && emailTimer > 0)}>
            {isSendingEmail ? '발송 중...' : (isEmailCodeSent && emailTimer > 0 ? `재발송(${formatTimer(emailTimer)})` : '인증코드 발송')}
          </button>
        </div>
        
        {isEmailCodeSent && !isEmailVerified && (
          <div className="email-verification">
            <input type="text" placeholder="인증 코드 입력" 
              value={emailCode} onChange={(e) => setEmailCode(e.target.value)}
              maxLength={6}/>
            <button type="button" onClick={verifyEmailCode} className="verify-button">
              인증하기
            </button>
          </div>
        )}
        {isEmailVerified && (
          <div className="validation-message success">
            ✓ 이메일 인증이 완료되었습니다.
          </div>
        )}

        <input type="number" id="userAge" placeholder="나이" required
          value={user.userAge} onChange={handleChange} min="1" max="150"/>

        <input type="tel" id="userPhone" placeholder="휴대폰번호 (예: 010-1234-5678)" required
          value={user.userPhone} onChange={handleChange}/>

        <button type="submit">회원가입</button>
      </form>
    </div>
  )
}

export default SignUpRoutePage
