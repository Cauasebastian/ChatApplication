// Message.java
package com.involveininnovation.chat.model;

import com.fasterxml.jackson.annotation.JsonFormat;
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

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Status status;

    private Boolean isPrivate;
}
