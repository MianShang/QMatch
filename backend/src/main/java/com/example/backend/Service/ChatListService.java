package com.example.backend.Service;

import com.example.backend.Dto.Request.ChatListRequestDto;
import com.example.backend.Dto.Response.ChatListResponseDto;
import com.example.backend.Entity.ChatList;
import com.example.backend.Entity.ChatRoom;
import com.example.backend.Entity.User;
import com.example.backend.Repository.ChatListRepository;
import com.example.backend.Repository.ChatRoomRepository;
import com.example.backend.Repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatListService {

    private final ChatListRepository chatListRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;


    // 채팅 내역 저장하는 Service
    public boolean saveChat(ChatListRequestDto chatListRequestDto){

        // DTO로 넘어온 데이터로 Find
        Optional<ChatRoom> chatRoom = chatRoomRepository.findById(chatListRequestDto.getChatRoom());
        Optional<User>     user     = userRepository.findByUserId(chatListRequestDto.getUserId());

        // 만일 없는 객체일시 저장 x
        if(chatRoom.isEmpty() || user.isEmpty()) {
            return false;
        }

        // Entity 객체 생성
        ChatList chatList = new ChatList();

        // Set
        chatList.setChatContent(chatListRequestDto.getChatContent());
        chatList.setChatRoom(chatRoom.get());
        chatList.setUser(user.get());
        chatList.setUserName(user.get().getUserName());


        // DB 저장
        chatListRepository.save(chatList);

        return true;
    }

    // 시스템 메시지 저장하는 Service (운영 유의사항 등)
    public boolean saveSystemMessage(String roomId, String messageContent) {
        Optional<ChatRoom> chatRoom = chatRoomRepository.findById(roomId);
        
        if (chatRoom.isEmpty()) {
            return false;
        }

        // Entity 객체 생성
        ChatList chatList = new ChatList();

        // Set
        chatList.setChatContent(messageContent);
        chatList.setChatRoom(chatRoom.get());
        chatList.setUser(null); // 시스템 메시지는 User가 null
        chatList.setUserName("시스템"); // 시스템 메시지임을 표시

        // DB 저장
        chatListRepository.save(chatList);

        return true;
    }

    // 멤버 입장 메시지 저장하는 Service
    public boolean saveMemberJoinMessage(String roomId, String messageContent) {
        Optional<ChatRoom> chatRoom = chatRoomRepository.findById(roomId);
        
        if (chatRoom.isEmpty()) {
            return false;
        }

        // Entity 객체 생성
        ChatList chatList = new ChatList();

        // Set
        chatList.setChatContent(messageContent);
        chatList.setChatRoom(chatRoom.get());
        chatList.setUser(null); // 멤버 입장 메시지는 User가 null
        chatList.setUserName("MEMBER_JOIN"); // 멤버 입장 메시지임을 표시

        // DB 저장
        chatListRepository.save(chatList);

        return true;
    }

    // 채팅 내역 가져오는 Service
    public List<ChatListResponseDto> getChatList(String roomId){
        // RoomId에 해당하는 채팅 리스트를 찾음
        List<ChatList> chatList = chatListRepository.findByChatRoom_Id(roomId);

        // null 방지
        if (chatList == null) {
            return new ArrayList<>();
        }

        // return할 DTO로 List 타입 설정
        List<ChatListResponseDto> chatListResponseDtoList = new ArrayList<>();


        // 리스트에 데이터 담기
        for (ChatList chatList1 : chatList) {
            // DTO 객체 생성
            ChatListResponseDto chatListResponseDto = new ChatListResponseDto();

            chatListResponseDto.setMessage(chatList1.getChatContent());
            // userName이 "MEMBER_JOIN"이면 name도 "MEMBER_JOIN"으로 설정, 그 외에는 기존 로직 유지
            if ("MEMBER_JOIN".equals(chatList1.getUserName())) {
                chatListResponseDto.setName("MEMBER_JOIN");
            } else {
                chatListResponseDto.setName(chatList1.getUser() != null ? chatList1.getUser().getUserId() : "SYSTEM");
            }
            chatListResponseDto.setChatDate(chatList1.getChatDate());
            chatListResponseDto.setUserName(chatList1.getUserName());

            // List add
            chatListResponseDtoList.add(chatListResponseDto);
        }

        return chatListResponseDtoList;
    }


}
