import MessageList from "./MessageList";
import RoomSettingsModal from "../../modal/RoomSettingsModal/RoomSettingsModal";
import { useState } from "react";

function ChatRoom({
    userData,
    selectedRoom,
    selectedFriendRoom,
    messages,
    friendMessages,
    input,
    setInput,
    sendMessage,
    messageContainerRef,
    onRoomUpdated,
}) {
    const [showRoomSettings, setShowRoomSettings] = useState(false);
    return (
            <div className="chatSize">
                {/* 다대다 채팅방 헤더 */}
                {selectedRoom && (
                    <div className="chatRoomHeader">
                        <div className="chatRoomInfo">
                            <h3 className="chatRoomTitle">{selectedRoom.name}</h3>
                            <div className="chatRoomMeta">
                                <span className="gameName">{selectedRoom.gameName}</span>
                                <span className="userCount">
                                    {selectedRoom.currentUsers}/{selectedRoom.maxUsers}
                                </span>
                            </div>
                        </div>
                        <div className="chatRoomActions">
                            {selectedRoom.hostUserId === userData?.userId && (
                                <span className="hostBadge">방장</span>
                            )}
                            {selectedRoom.hostUserId === userData?.userId && (
                                <button 
                                    className="roomSettingsBtn"
                                    onClick={() => setShowRoomSettings(true)}
                                    title="방 설정"
                                >
                                    ⚙️
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* 메시지 영역 */}
                <div ref={messageContainerRef} className="scroll-container chatDivStyle">
                    {selectedRoom ? (
                        <MessageList messages={messages} userData={userData} />
                    ) : selectedFriendRoom ? (
                        <MessageList messages={friendMessages} userData={userData} />
                    ) : (
                        <div className="empty-chat-container">
                            <div className="empty-chat-logo">
                                <img src="/qmatchLogo.png" alt="QMatch" className="qmatch-logo-image" />
                            </div>
                            <p className="empty-chat-text">채팅방을 선택하여 대화를 시작하세요</p>
                        </div>
                    )}
                </div>

                {/* 입력창 */}
                {(selectedRoom || selectedFriendRoom) && (
                    <div className="inputSize">
                        <input
                            className="chatInputStyle"
                            type="text"
                            placeholder="메시지를 입력하세요..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") sendMessage();
                            }}
                        />
                        <button className="chatButtonStyle" onClick={sendMessage}>
                            ➤
                        </button>
                    </div>
                )}

                {/* 방 설정 모달 */}
                <RoomSettingsModal
                    open={showRoomSettings}
                    onClose={() => setShowRoomSettings(false)}
                    room={selectedRoom}
                    onRoomUpdated={onRoomUpdated}
                />
            </div>
    );
}

export default ChatRoom;