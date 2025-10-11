import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './App.jsx'


createRoot(document.getElementById('root')).render(
  //<StrictMode> 이거 때문에 자꾸 두번 호출되서 자동 로그인에 오류가 생겨 잠시 막아두겠음 
    <BrowserRouter>
      <App />
    </BrowserRouter>
 // </StrictMode>,
)
