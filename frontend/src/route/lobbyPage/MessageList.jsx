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

            <div className='chatStyle'>{msg.message}</div>
          </div>
        ))
      }
    </div>
  );
});

export default MessageList;