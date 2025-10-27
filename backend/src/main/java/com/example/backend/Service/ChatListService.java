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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatListService {

    private final ChatListRepository chatListRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;


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
        chatList.setIsPinned(chatListRequestDto.getIsPinned() != null ? chatListRequestDto.getIsPinned() : false);


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

            chatListResponseDto.setId(chatList1.getId());
            chatListResponseDto.setMessage(chatList1.getChatContent());
            // userName이 "MEMBER_JOIN"이면 name도 "MEMBER_JOIN"으로 설정, 그 외에는 기존 로직 유지
            if ("MEMBER_JOIN".equals(chatList1.getUserName())) {
                chatListResponseDto.setName("MEMBER_JOIN");
            } else {
                chatListResponseDto.setName(chatList1.getUser() != null ? chatList1.getUser().getUserId() : "SYSTEM");
            }
            chatListResponseDto.setChatDate(chatList1.getChatDate());
            chatListResponseDto.setUserName(chatList1.getUserName());
            chatListResponseDto.setIsPinned(chatList1.getIsPinned());

            // List add
            chatListResponseDtoList.add(chatListResponseDto);
        }

        return chatListResponseDtoList;
    }
    
    //메시지 고정/해제 (하나만 고정 가능)
    @Transactional
    public ChatListResponseDto togglePinMessage(Long messageId, String roomId) {
        ChatList message = chatListRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("메시지를 찾을 수 없습니다: " + messageId));
        
        // 같은 채팅방의 메시지인지 확인
        if (!message.getChatRoom().getId().equals(roomId)) {
            throw new IllegalArgumentException("해당 채팅방의 메시지가 아닙니다.");
        }
        
        // 현재 메시지가 이미 고정되어 있다면 해제
        if (message.getIsPinned()) {
            message.setIsPinned(false);
        } else {
            // 다른 메시지가 고정되어 있다면 해제
            List<ChatList> pinnedMessages = chatListRepository.findByChatRoomIdAndIsPinnedTrue(roomId);
            for (ChatList pinnedMessage : pinnedMessages) {
                pinnedMessage.setIsPinned(false);
                chatListRepository.save(pinnedMessage);
            }
            
            // 현재 메시지 고정
            message.setIsPinned(true);
        }
        
        ChatList saved = chatListRepository.save(message);
        
        // 응답 DTO 생성
        ChatListResponseDto dto = new ChatListResponseDto();
        dto.setId(saved.getId());
        dto.setMessage(saved.getChatContent());
        dto.setName(saved.getUser() != null ? saved.getUser().getUserId() : "SYSTEM");
        dto.setChatDate(saved.getChatDate());
        dto.setUserName(saved.getUserName());
        dto.setIsPinned(saved.getIsPinned());
        
        // 브로드캐스트: 채팅방 참여자에게 메시지 고정 상태 변경 알림
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, dto);
        
        return dto;
    }

}
