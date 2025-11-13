import { useState, useEffect, useContext  } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import axios from 'axios';
import './loginPage.css'
import { LogContext } from '../../App.jsx';

import LogInRoutePage from './loginPageRoute/loginRoutePage';
import SignUpRoutePage from './loginPageRoute/signupRoutePage';


function LoginPage() {
  // 기본값은 로그인 페이지로
  const [isResister, setIsRegister] = useState(false);
  
  // 테마 컨텍스트 가져오기
  const { theme, toggleTheme } = useContext(LogContext);

  return (
    <div className='fullscreen cosmic-background position login-page'>
      {/* 테마 전환 버튼 */}
      <div className="login-theme-toggle">
        <button
          onClick={toggleTheme}
          className="theme-toggle-button"
          title={`현재 테마: ${theme === 'dark' ? '다크' : theme === 'light' ? '라이트' : '블루'}`}
        >
          {theme === 'dark' && '🌙'}
          {theme === 'light' && '☀️'}
          {theme === 'blue' && '💙'}
        </button>
      </div>

      {/* 왼쪽: 로고 영역 */}
      <div className="login-left-section">
        <div className="brand-header">
          <div className="brand-logo">
            <img 
              src="/qmatchLogo.png"
              alt="QMatch" 
              className="qmatch-logo-image" 
            />
          </div>
        </div>
      </div>

      {/* 오른쪽: 로그인 폼 영역 */}
      <div className="login-right-section">
        <div className={`LogComponentStyle ${isResister ? 'signup-mode' : ''}`}>
            {isResister 
            ? <SignUpRoutePage onSuccess={() => setIsRegister(false)} /> 
            : <LogInRoutePage />}
        </div>

        <div className='LogChangeButtonStyle' onClick={()=>{ setIsRegister(!isResister) }}>
          {
            isResister ? <h2>로그인</h2> : <h2>회원가입</h2>
          }
        </div>
      </div>
      
    </div>
  )
}

export default LoginPage
