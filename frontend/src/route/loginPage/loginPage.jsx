import { useState, useEffect, useContext  } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
//import axios from 'axios';
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
    <div className='fullscreen position'>
      {/* 테마 전환 버튼 */}
      <div className="login-theme-toggle">
        <button
          onClick={toggleTheme}
          className="theme-toggle-button"
          title={`현재 테마: ${theme === 'dark' ? '다크' : theme === 'light' ? '라이트' : theme === 'pink' ? '핑크' : '블루'}`}
        >
          {theme === 'dark' && '🌙'}
          {theme === 'light' && '☀️'}
          {theme === 'pink' && '💖'}
          {theme === 'blue' && '💙'}
        </button>
      </div>
      
      {/* 브랜드 로고 및 타이틀 */}
      <div className="brand-header">
        <div className="brand-logo">
          <img 
            src={
              theme === 'dark' ? "./qmatchLogoBlue.png" : 
              theme === 'pink' ? "./qmatchLogoPink.png" : 
              "/qmatchLogo.png"
            } 
            alt="QMatch" 
            className="qmatch-logo-image" 
          />
        </div>
      </div>

      <div className='LogComponentStyle'>
          {isResister 
          ? <SignUpRoutePage onSuccess={() => setIsRegister(false)} /> 
          : <LogInRoutePage />}
      </div>

      <div className='LogChangeButtonStyle' onClick={()=>{ setIsRegister(!isResister) }}>
        {
          isResister ? <h2>Login</h2> : <h2>Signup</h2>
        }
      </div>
      
    </div>
  )
}

export default LoginPage
