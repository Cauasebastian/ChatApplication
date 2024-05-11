package org.sebastiandev.chatapplication.chatroom;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;

    public Optional<String> getChatRoomId(String senderId, String receiverId, boolean createNewRoomIfNotExists) {
        return chatRoomRepository.findBySenderIdAndReceiverId(senderId, receiverId)
                .map(ChatRoom::getId)
                .or(() -> {
                    if (createNewRoomIfNotExists) {
                        return Optional.of(createChat(senderId, receiverId));
                    } else {
                        return Optional.empty();
                    }
                });
    }
    private String createChat(String senderId, String receiverId) {
         var chatId = String.format("%s_%s", senderId, receiverId); //will be like sender_receiver

        ChatRoom senderReceiver = ChatRoom.builder()
                .id(chatId)
                .senderId(senderId)
                .receiverId(receiverId)
                .build();
        ChatRoom receiverSender = ChatRoom.builder()
                .id(chatId)
                .senderId(receiverId)
                .receiverId(senderId)
                .build();
        chatRoomRepository.save(senderReceiver);
        chatRoomRepository.save(receiverSender);
         return null;
    }
}
