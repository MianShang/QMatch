import { memo } from "react";


const MessageList = memo(({ messages, userData }) => {
  return (

    <div className='chatContentStyle'>
      {
        messages.map((msg, i) => (
          <div key={i}
            className={`message-wrapper ${msg.name == userData?.userId ? 'myChatStyle' : 'otherChatStyle'}`}>

            {msg.name !== userData?.userId && (
              <div className="message-author">{msg.userName}</div>
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
            <div className='chatStyle'>{msg.message}</div>
          </div>
        ))
      }
    </div>
  );
});

export default MessageList;