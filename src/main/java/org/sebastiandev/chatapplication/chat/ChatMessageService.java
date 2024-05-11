package org.sebastiandev.chatapplication.chat;

import lombok.RequiredArgsConstructor;
import org.sebastiandev.chatapplication.chatroom.ChatRoomService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatMessageService {
    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomService chatRoomService;

    public ChatMessage saveMessage(ChatMessage chatMessage){
        var chatId = chatRoomService.getChatRoomId(chatMessage.getSenderId(),
                chatMessage.getReceiverId(), true).orElseThrow(); // thow exception if chatId is not present
        chatMessage.setChatId(chatId);
        chatMessageRepository.save(chatMessage);
        return chatMessage;
    }
    public List<ChatMessage> findChatMessage(
            String senderId, String receiverId
    ){
        var chatId = chatRoomService.getChatRoomId(senderId ,receiverId, false);

        return chatId.map(chatMessageRepository::findByChatId).orElse(new ArrayList<>());

    }
}
