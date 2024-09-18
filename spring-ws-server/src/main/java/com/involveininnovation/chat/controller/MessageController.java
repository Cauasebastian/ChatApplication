package com.involveininnovation.chat.controller;

import com.involveininnovation.chat.model.MessageEntity;
import com.involveininnovation.chat.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    // Fetch all private messages for a user
    @GetMapping("/private/{username}")
    public List<MessageEntity> getPrivateMessages(@PathVariable String username) {
        return messageRepository.findPrivateMessagesForUser(username);
    }
}
