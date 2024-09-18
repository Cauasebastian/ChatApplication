package com.involveininnovation.chat.controller;

import com.involveininnovation.chat.model.MessageEntity;
import com.involveininnovation.chat.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    // Fetch all public messages
    @GetMapping("/public")
    public List<MessageEntity> getPublicMessages() {
        return messageRepository.findByIsPrivateFalseOrderByDateAsc();
    }

    // Fetch all private messages for the authenticated user
    @GetMapping("/private")
    public List<MessageEntity> getPrivateMessages(Principal principal) {
        String username = principal.getName();
        return messageRepository.findPrivateMessagesForUser(username);
    }
}
