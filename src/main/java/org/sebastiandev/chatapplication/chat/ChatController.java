package org.sebastiandev.chatapplication.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageService chatMessageService;

    @MessageMapping("/chat")
    public void processMessageService(
            @Payload ChatMessage chatMessage
    ){
        ChatMessage saveMessage = chatMessageService.saveMessage(chatMessage);
        messagingTemplate.convertAndSendToUser(
                chatMessage.getReceiverId(), "/queue/messages",
                ChatNotification.builder()
                        .id(saveMessage.getId())
                        .senderId(saveMessage.getSenderId())
                        .receiverId(saveMessage.getReceiverId())
                        .content(saveMessage.getContent())
                        .build()
        );
    }

    @GetMapping("/messages/{senderId}/{receiverId}")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable String senderId, @PathVariable String receiverId) {
        return ResponseEntity.ok(chatMessageService.findChatMessage(senderId, receiverId));
    }
}