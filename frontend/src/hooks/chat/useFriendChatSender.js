import axios  from "axios";

export function useFriendChatSender(client ,selectedFriendRoom, userData, input, setInput)
{
    function sendFriendMessage()
    {
        //친구 방 선택 및 입력, 구독 X 실행 X
        if(!client || !selectedFriendRoom || !input.trim()) return;

        const message = 
        {
            sendId : userData.userId,
            message : input,
        };
        console.log("보낼 메시지:", message);
        client.publish({
            destination : `/app/friends/chat/${selectedFriendRoom.roomId}`,
            body : JSON.stringify(message)
        });

        setInput('');
    }
    return sendFriendMessage;

}