package com.involveininnovation.chat.model;

import lombok.*;

import java.util.Date;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
public class Message {
    private String senderName;
    private String receiverName;
    private String message;
    private Date date;
    private Status status;
    private Boolean isPrivate; // Flag para distinguir mensagens privadas e públicas
}
