package org.sebastiandev.chatapplication.chatroom;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document
public class ChatRoom {

    @Id
    private String id;
    private String ChatName;
    private String senderId;
    private String receiverId;

}
