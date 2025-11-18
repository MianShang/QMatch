import { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from '@axios';
import './FindAccountModal.css';

function FindIdModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [foundUserId, setFoundUserId] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const isSendingEmailRef = useRef(false); // 중복 클릭 방지를 위한 ref

  if (!isOpen) return null;

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
    if (!emailRegex.test(email)) {
      isSendingEmailRef.current = false;
      setIsSendingEmail(false);
      toast.error('올바른 이메일 형식이 아닙니다.');
      return;
    }

    try {
      await axios.post('/api/user/send-find-id-verification', null, {
        params: { email: email }
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
        const errorMessage = error.response.data;
        toast.error(errorMessage);
        
        // 등록된 이메일이 없는 경우 입력 필드 초기화
        if (errorMessage.includes('등록된 사용자가 없습니다') || 
            errorMessage.includes('등록된 사용자')) {
          setEmail('');
          setEmailCode('');
          setIsEmailCodeSent(false);
          setIsEmailVerified(false);
          setEmailTimer(0);
        }
      } else {
        toast.error("이메일 발송 중 오류가 발생했습니다.");
      }
    } finally {
      isSendingEmailRef.current = false;
      setIsSendingEmail(false);
    }
  };

  // 이메일 인증 코드 검증 및 아이디 찾기
  const verifyAndFindId = async () => {
    if (!emailCode) {
      toast.error('인증 코드를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('/api/user/find-id', null, {
        params: { 
          email: email,
          code: emailCode
        }
      });
      setIsEmailVerified(true);
      setFoundUserId(response.data);
      toast.success('아이디를 찾았습니다.');
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMessage = String(error.response.data);
        toast.error(errorMessage);
        
        // 등록된 사용자가 없는 경우 입력 필드 초기화
        if (errorMessage.includes('등록된 사용자가 없습니다') || 
            errorMessage.includes('해당 이메일로 등록된 사용자가 없습니다') ||
            errorMessage.includes('등록된 사용자')) {
          setEmail('');
          setEmailCode('');
          setIsEmailCodeSent(false);
          setIsEmailVerified(false);
          setEmailTimer(0);
        }
        // 인증 코드가 틀린 경우 인증 코드만 초기화 (재입력 가능하도록)
        else if (errorMessage.includes('인증 코드가 일치하지 않습니다') ||
                 errorMessage.includes('인증 코드')) {
          setEmailCode('');
        }
        // 기타 400 에러의 경우도 인증 코드 초기화
        else if (error.response.status === 400) {
          setEmailCode('');
        }
      } else {
        toast.error("아이디 찾기 중 오류가 발생했습니다.");
      }
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    setEmail('');
    setEmailCode('');
    setIsEmailCodeSent(false);
    setIsEmailVerified(false);
    setEmailTimer(0);
    setFoundUserId('');
    onClose();
  };

  return (
    <div className="find-account-modal-overlay" onClick={handleClose}>
      <div className="modal-content find-account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>아이디 찾기</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          {!foundUserId ? (
            <>
              <div className="input-group">
                <div className="input-with-button">
                  <input 
                    type="email" 
                    placeholder="이메일을 입력하세요" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isEmailCodeSent}
                  />
                  <button 
                    type="button" 
                    onClick={sendEmailVerification} 
                    className="send-button"
                    disabled={isSendingEmail || (isEmailCodeSent && emailTimer > 0)}
                  >
                    {isSendingEmail ? '발송 중...' : (isEmailCodeSent && emailTimer > 0 ? `재발송(${formatTimer(emailTimer)})` : '인증코드 발송')}
                  </button>
                </div>
              </div>

              {isEmailCodeSent && !isEmailVerified && (
                <div className="input-group">
                  <label>인증 코드</label>
                  <div className="input-with-button">
                    <input 
                      type="text" 
                      placeholder="인증 코드를 입력하세요" 
                      value={emailCode} 
                      onChange={(e) => setEmailCode(e.target.value)}
                      maxLength={6}
                    />
                    <button 
                      type="button" 
                      onClick={verifyAndFindId} 
                      className="verify-button"
                    >
                      확인
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="result-section">
              <div className="success-message">
                <p>회원님의 아이디는</p>
                <p className="found-id">{foundUserId}</p>
                <p>입니다.</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="close-modal-button" onClick={handleClose}>
            {foundUserId ? '닫기' : '취소'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FindIdModal;

