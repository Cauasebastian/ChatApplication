package com.involveininnovation.chat.controller;

import com.involveininnovation.chat.model.Message;
import com.involveininnovation.chat.model.MessageEntity;
import com.involveininnovation.chat.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Date;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @Autowired
    private MessageRepository messageRepository;

    @MessageMapping("/message")
    @SendTo("/chatroom/public")
    public Message receiveMessage(@Payload Message message) {
        message.setIsPrivate(false);
        saveMessageToDatabase(message);
        return message;
    }

    @MessageMapping("/private-message")
    public Message recMessage(@Payload Message message) {
        message.setIsPrivate(true);
        simpMessagingTemplate.convertAndSendToUser(message.getReceiverName(), "/private", message);
        saveMessageToDatabase(message);
        return message;
    }

    private void saveMessageToDatabase(Message message) {
        MessageEntity messageEntity = new MessageEntity();
        messageEntity.setSenderName(message.getSenderName());
        messageEntity.setReceiverName(message.getReceiverName());
        messageEntity.setMessage(message.getMessage());
        messageEntity.setStatus(message.getStatus());
        messageEntity.setIsPrivate(message.getIsPrivate());
        messageEntity.setDate(new Date());

        messageRepository.save(messageEntity);
    }
}
