import { memo } from "react";


const MessageList = memo(({ messages, userData }) => {
  return (

    <div className='chatContentStyle'>
      {
        messages.map((msg, i) => {
          // 멤버 입장 메시지인지 먼저 확인
          const isMemberJoinMessage = msg.name === "MEMBER_JOIN" || msg.userName === "MEMBER_JOIN";
          // 시스템 메시지인지 확인 (멤버 입장 메시지가 아닌 경우에만)
          const isSystemMessage = !isMemberJoinMessage && (msg.name === "SYSTEM" || msg.name === "시스템" || msg.type === "system");
          
          return (
            <div key={i}
              className={`message-wrapper ${isSystemMessage ? 'system-message' : isMemberJoinMessage ? 'member-join-message' : (msg.name == userData?.userId ? 'myChatStyle' : 'otherChatStyle')}`}>

              {!isSystemMessage && !isMemberJoinMessage && msg.name !== userData?.userId && (
                <div className="message-author">{msg.userName}</div>
              )}
              
              {/* 시스템 메시지인 경우 특별한 표시 */}
              {isSystemMessage && (
                  <div className="system-message-header">
                    <span className="system-icon">🤖</span>
                    <span className="system-label">시스템 알림</span>
                  </div>
              )}
              
              {/* 멤버 입장 메시지인 경우 시간만 표시 */}
              {isMemberJoinMessage && (
                  <div className="message-date">
                    {msg.chatDate
                      ? new Date(msg.chatDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false, // 24시간제
                        })
                      : ""}
                  </div>
              )}
              
              {/* 일반 채팅 시각 (24시간제, HH:MM) */}
              {!isMemberJoinMessage && (
                  <div className="message-date">
                    {msg.chatDate
                      ? new Date(msg.chatDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false, // 24시간제
                        })
                      : ""}
                  </div>
              )}
              <div className={`chatStyle ${isSystemMessage ? 'system-chat-content' : ''} ${isMemberJoinMessage ? 'member-join-content' : ''}`}>{msg.message}</div>
            </div>
          );
        })
      }
    </div>
  );
});

export default MessageList;