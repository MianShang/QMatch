import { memo } from "react";


const MessageList = memo(({ messages, userData }) => {
  return (

    <div className='chatContentStyle'>
      {
        messages.map((msg, i) => {
          // 시스템 메시지인지 확인
          const isSystemMessage = msg.name === "SYSTEM" || msg.name === "시스템" || msg.type === "system";
          
          return (
            <div key={i}
              className={`message-wrapper ${isSystemMessage ? 'system-message' : (msg.name == userData?.userId ? 'myChatStyle' : 'otherChatStyle')}`}>

              {!isSystemMessage && msg.name !== userData?.userId && (
                <div className="message-author">{msg.userName}</div>
              )}
              
              {/* 시스템 메시지인 경우 특별한 표시 */}
              {isSystemMessage && (
                  <div className="system-message-header">
                    <span className="system-icon">🤖</span>
                    <span className="system-label">시스템 알림</span>
                  </div>
              )}
              
              {/* 채팅 시각 (24시간제, HH:MM) */}
              <div className="message-date">
                {msg.chatDate
                  ? new Date(msg.chatDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false, // 24시간제
                    })
                  : ""}
              </div>
              <div className={`chatStyle ${isSystemMessage ? 'system-chat-content' : ''}`}>{msg.message}</div>
            </div>
          );
        })
      }
    </div>
  );
});

export default MessageList;