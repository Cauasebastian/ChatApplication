package com.involveininnovation.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocketConfig is a configuration class that sets up WebSocket and STOMP protocol related configurations.
 * It implements WebSocketMessageBrokerConfigurer interface to provide custom configuration for WebSocket messaging.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * This method is used to register STOMP endpoints.
     * Here, "/ws" is registered as a STOMP endpoint, and it allows cross-origin requests from all domains.
     * SockJS is enabled to provide fallback options for browsers that don't support WebSocket.
     *
     * @param registry an instance of StompEndpointRegistry.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }

    /**
     * This method is used to configure the message broker.
     * It sets "/app" as the application destination prefix, which is used to route messages from clients to server message-handling methods.
     * It enables a simple in-memory message broker to carry the messages back to the client on destinations prefixed with "/chatroom" and "/user".
     * It sets "/user" as the prefix for user-specific destinations.
     *
     * @param registry an instance of MessageBrokerRegistry.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/chatroom","/user");
        registry.setUserDestinationPrefix("/user");
    }
}