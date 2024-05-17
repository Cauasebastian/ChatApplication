package com.involveininnovation.chat.controller;

import com.involveininnovation.chat.model.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * ChatController is a controller class that handles incoming chat messages.
 * It uses the SimpMessagingTemplate for sending messages to specific users.
 */
@Controller
public class ChatController {

    /**
     * The SimpMessagingTemplate is used to send messages to specific users.
     */
    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    /**
     * This method is mapped to "/message" and sends the received message to "/chatroom/public".
     * It receives a Message object as payload and returns the same message.
     *
     * @param message the incoming message.
     * @return the same message that was received.
     */
    @MessageMapping("/message")
    @SendTo("/chatroom/public")
    public Message receiveMessage(@Payload Message message){
        return message;
    }

    /**
     * This method is mapped to "/private-message" and sends the received message to a specific user.
     * It receives a Message object as payload, sends the message to the receiver specified in the message, and returns the same message.
     *
     * @param message the incoming message.
     * @return the same message that was received.
     */
    @MessageMapping("/private-message")
    public Message recMessage(@Payload Message message){
        simpMessagingTemplate.convertAndSendToUser(message.getReceiverName(),"/private",message);
        System.out.println(message.toString());
        return message;
    }
}