import { useState, useEffect, useContext  } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import axios from 'axios';
import './loginPage.css'

import LogInRoutePage from './loginPageRoute/loginRoutePage';
import SignUpRoutePage from './loginPageRoute/signupRoutePage';


function LoginPage() {
  // 기본값은 로그인 페이지로
  const [isResister, setIsRegister] = useState(false);


  return (
    <div className='fullscreen position'>
      {/* 브랜드 로고 및 타이틀 */}
      <div className="brand-header">
        <div className="brand-logo">
          <div className="logo-icon">Q</div>
          <span className="brand-name">QMatch</span>
        </div>
        <p className="brand-subtitle">게임 매칭 플랫폼</p>
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
