package com.involveininnovation.chat.repository;

import com.involveininnovation.chat.model.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    // Fetch all public messages ordered by date
    List<MessageEntity> findByIsPrivateFalseOrderByDateAsc();

    // Custom query to fetch private messages for a user
    @Query("SELECT m FROM MessageEntity m WHERE m.isPrivate = true AND (m.senderName = :username OR m.receiverName = :username) ORDER BY m.date ASC")
    List<MessageEntity> findPrivateMessagesForUser(@Param("username") String username);
}
