import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './FindAccountModal.css';

function FindPasswordModal({ isOpen, onClose }) {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  if (!isOpen) return null;

  // 이메일 인증 코드 발송
  const sendEmailVerification = async () => {
    if (isSendingEmail || (isEmailCodeSent && emailTimer > 0)) {
      return; // 이미 발송 중이거나 타이머가 진행 중이면 중복 클릭 방지
    }

    if (!userId) {
      toast.error('아이디를 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setIsSendingEmail(true);
    try {
      await axios.post('/api/user/send-email-verification', null, {
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
        toast.error(error.response.data);
      } else {
        toast.error("이메일 발송 중 오류가 발생했습니다.");
      }
    } finally {
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
          email: email,
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

  // 새 비밀번호로 변경
  const changePassword = async () => {
    if (!isEmailVerified) {
      toast.error('이메일 인증을 먼저 완료해주세요.');
      return;
    }

    if (!newPassword) {
      toast.error('새 비밀번호를 입력해주세요.');
      return;
    }

    const pwRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+=~`]).{8,16}$/;
    if (!pwRegex.test(newPassword)) {
      toast.error('비밀번호는 8~16자, 대문자/특수문자를 각 1개 이상 포함해야 합니다.');
      return;
    }

    if (newPassword !== passwordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      await axios.post('/api/user/find-password', null, {
        params: { 
          userId: userId,
          email: email,
          newPassword: newPassword
        }
      });
      setIsCompleted(true);
      toast.success('비밀번호가 성공적으로 변경되었습니다.');
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data);
      } else {
        toast.error("비밀번호 변경 중 오류가 발생했습니다.");
      }
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    setUserId('');
    setEmail('');
    setEmailCode('');
    setIsEmailCodeSent(false);
    setIsEmailVerified(false);
    setEmailTimer(0);
    setNewPassword('');
    setPasswordConfirm('');
    setIsCompleted(false);
    setIsSendingEmail(false);
    onClose();
  };

  return (
    <div className="find-account-modal-overlay" onClick={handleClose}>
      <div className="modal-content find-account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>비밀번호 찾기</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          {!isCompleted ? (
            <>
              {!isEmailVerified ? (
                <>
                  <div className="input-group">
                    <label>아이디</label>
                    <input 
                      type="text" 
                      placeholder="아이디를 입력하세요" 
                      value={userId} 
                      onChange={(e) => setUserId(e.target.value)}
                      disabled={isEmailCodeSent}
                    />
                  </div>

                  <div className="input-group">
                    <label>이메일</label>
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

                  {isEmailCodeSent && (
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
                          onClick={verifyEmailCode} 
                          className="verify-button"
                        >
                          확인
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="verification-success">
                    <p>✓ 이메일 인증이 완료되었습니다.</p>
                  </div>
                  <div className="input-group">
                    <label>새 비밀번호</label>
                    <input 
                      type="password" 
                      placeholder="새 비밀번호를 입력하세요 (8~16자, 대문자/특수문자 각 1개 이상)" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>비밀번호 확인</label>
                    <input 
                      type="password" 
                      placeholder="비밀번호를 다시 입력하세요" 
                      value={passwordConfirm} 
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <button 
                      type="button" 
                      onClick={changePassword} 
                      className="change-password-button"
                    >
                      비밀번호 변경
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="result-section">
              <div className="success-message">
                <p>비밀번호가 성공적으로</p>
                <p className="found-id">변경되었습니다</p>
                <p className="info-text">새 비밀번호로 로그인해주세요.</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="close-modal-button" onClick={handleClose}>
            {isCompleted ? '닫기' : '취소'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FindPasswordModal;

