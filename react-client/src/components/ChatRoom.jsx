import React, { useEffect, useState } from 'react';
import { over } from 'stompjs';
import SockJS from 'sockjs-client';
import './ChatRoom.css';

var stompClient = null;

const ChatRoom = () => {
    const [privateChats, setPrivateChats] = useState(new Map());
    const [publicChats, setPublicChats] = useState([]);
    const [tab, setTab] = useState("CHATROOM");
    const [userData, setUserData] = useState({
        username: '',
        password: '',
        connected: false,
        message: ''
    });
    const [avatarColors, setAvatarColors] = useState({});

    useEffect(() => {
        console.log(userData);
    }, [userData]);

    const generateRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const connect = () => {
        let Sock = new SockJS('http://localhost:8080/ws');
        stompClient = over(Sock);
        stompClient.connect({
            'Authorization': 'Basic ' + btoa(`${userData.username}:${userData.password}`)
        }, onConnected, onError);
    };

    const onConnected = () => {
        setUserData({ ...userData, "connected": true });
        stompClient.subscribe('/chatroom/public', onMessageReceived);
        stompClient.subscribe('/user/' + userData.username + '/private', onPrivateMessage);

        // Enviar mensagem de JOIN
        userJoin();

        // Fetch old messages
        fetchOldMessages();
    };

    const fetchOldMessages = () => {
        // Fetch public messages
        fetch('http://localhost:8080/messages/public', {
            headers: {
                'Authorization': 'Basic ' + btoa(`${userData.username}:${userData.password}`)
            }
        })
            .then(res => res.json())
            .then(data => {
                // Sort messages by date
                data.sort((a, b) => new Date(a.date) - new Date(b.date));
                setPublicChats(data);

                // Set avatar colors for public chat users
                data.forEach(message => {
                    if (!avatarColors[message.senderName]) {
                        setAvatarColors(prevColors => ({
                            ...prevColors,
                            [message.senderName]: generateRandomColor()
                        }));
                    }
                });
            })
            .catch(error => console.error('Error fetching public messages:', error));

        // Fetch private messages for the user
        fetch(`http://localhost:8080/messages/private`, {
            headers: {
                'Authorization': 'Basic ' + btoa(`${userData.username}:${userData.password}`)
            }
        })
            .then(res => res.json())
            .then(data => {
                const chats = new Map();

                data.forEach(message => {
                    const chatUser = message.senderName === userData.username ? message.receiverName : message.senderName;

                    if (chats.has(chatUser)) {
                        chats.get(chatUser).push(message);
                    } else {
                        chats.set(chatUser, [message]);
                    }

                    // Set avatar colors for private chat users
                    if (!avatarColors[chatUser]) {
                        setAvatarColors(prevColors => ({
                            ...prevColors,
                            [chatUser]: generateRandomColor()
                        }));
                    }
                });

                // Sort messages in each private chat by date
                chats.forEach((messages, user) => {
                    messages.sort((a, b) => new Date(a.date) - new Date(b.date));
                });

                setPrivateChats(chats);
            })
            .catch(error => console.error('Error fetching private messages:', error));
    };

    const userJoin = () => {
        var chatMessage = {
            senderName: userData.username,
            status: "JOIN"
        };
        stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    };

    const userLeave = () => {
        var chatMessage = {
            senderName: userData.username,
            status: "LEAVE"
        };
        stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    };

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (stompClient && userData.connected) {
                userLeave();
                stompClient.disconnect();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [userData]);

    const onMessageReceived = (payload) => {
        var payloadData = JSON.parse(payload.body);
        switch (payloadData.status) {
            case "JOIN":
            case "LEAVE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                break;
            default:
                break;
        }
    };

    const onPrivateMessage = (payload) => {
        var payloadData = JSON.parse(payload.body);
        const sender = payloadData.senderName;

        if (privateChats.get(sender)) {
            privateChats.get(sender).push(payloadData);
        } else {
            privateChats.set(sender, [payloadData]);
        }
        setPrivateChats(new Map(privateChats));

        if (!avatarColors[sender]) {
            setAvatarColors(prevColors => ({
                ...prevColors,
                [sender]: generateRandomColor()
            }));
        }
    };

    const onError = (err) => {
        console.log(err);
    };

    const handleMessage = (event) => {
        const { value } = event.target;
        setUserData({ ...userData, "message": value });
    };

    const sendValue = () => {
        if (stompClient && userData.message.trim() !== "") {
            var chatMessage = {
                senderName: userData.username,
                message: userData.message,
                status: "MESSAGE"
            };
            stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
            setUserData({ ...userData, "message": "" });
        }
    };

    const sendPrivateValue = () => {
        if (stompClient && userData.message.trim() !== "") {
            var chatMessage = {
                senderName: userData.username,
                receiverName: tab,
                message: userData.message,
                status: "MESSAGE"
            };

            if (userData.username !== tab) {
                if (privateChats.get(tab)) {
                    privateChats.get(tab).push(chatMessage);
                    setPrivateChats(new Map(privateChats));
                } else {
                    privateChats.set(tab, [chatMessage]);
                    setPrivateChats(new Map(privateChats));
                }
            }
            stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
            setUserData({ ...userData, "message": "" });
        }
    };

    const handleUsername = (event) => {
        const { value, name } = event.target;
        setUserData({ ...userData, [name]: value });
    };

    const registerUser = () => {
        if (userData.username.trim() !== "" && userData.password.trim() !== "") {
            // Registrar usuário
            fetch('http://localhost:8080/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `username=${encodeURIComponent(userData.username)}&password=${encodeURIComponent(userData.password)}`
            })
                .then(response => {
                    if (response.ok) {
                        // Conectar após registrar
                        connect();
                    } else {
                        alert('Falha no registro');
                    }
                })
                .catch(error => console.error('Erro ao registrar:', error));
        } else {
            alert("Username e senha não podem estar vazios");
        }
    };

    const loginUser = () => {
        if (userData.username.trim() !== "" && userData.password.trim() !== "") {
            // Autenticar usuário
            fetch('http://localhost:8080/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `username=${encodeURIComponent(userData.username)}&password=${encodeURIComponent(userData.password)}`
            })
                .then(response => {
                    if (response.ok) {
                        // Conectar após autenticar
                        connect();
                    } else {
                        alert('Falha na autenticação');
                    }
                })
                .catch(error => console.error('Erro ao autenticar:', error));
        } else {
            alert("Username e senha não podem estar vazios");
        }
    };

    return (
        <div className="container">
            <h2>Chat Demo usando Websockets</h2>
            {userData.connected ? (
                <div className="chat-box">
                    <div className="member-list">
                        <ul>
                            <li
                                onClick={() => setTab("CHATROOM")}
                                className={`member ${tab === "CHATROOM" && "active"}`}
                            >
                                Chatroom
                            </li>
                            {[...privateChats.keys()].map((name, index) => (
                                <li
                                    onClick={() => setTab(name)}
                                    className={`member ${tab === name && "active"}`}
                                    key={index}
                                >
                                    {name}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {tab === "CHATROOM" && (
                        <div className="chat-content">
                            <ul className="chat-messages">
                                {publicChats.map((chat, index) => (
                                    <li
                                        className={`message ${
                                            chat.senderName === userData.username && "self"
                                        }`}
                                        key={index}
                                    >
                                        {chat.status === "MESSAGE" ? (
                                            <>
                                                {chat.senderName !== userData.username && (
                                                    <div
                                                        className="avatar"
                                                        style={{
                                                            backgroundColor: avatarColors[chat.senderName],
                                                        }}
                                                    >
                                                        {chat.senderName[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="message-info">
                                                    <div className="sender-name">{chat.senderName}</div>
                                                    <div className="message-data">{chat.message}</div>
                                                </div>
                                                {chat.senderName === userData.username && (
                                                    <div
                                                        className="avatar self"
                                                        style={{
                                                            backgroundColor: avatarColors[userData.username],
                                                        }}
                                                    >
                                                        {chat.senderName[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="notification">
                                                {chat.message}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            <div className="send-message">
                                <input
                                    type="text"
                                    className="input-message"
                                    placeholder="Digite a mensagem pública"
                                    value={userData.message}
                                    onChange={handleMessage}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            sendValue();
                                        }
                                    }}
                                />
                                <button type="button" className="send-button" onClick={sendValue}>
                                    Enviar
                                </button>
                            </div>
                        </div>
                    )}
                    {tab !== "CHATROOM" && (
                        <div className="chat-content">
                            <ul className="chat-messages">
                                {[...privateChats.get(tab)].map((chat, index) => (
                                    <li
                                        className={`message ${
                                            chat.senderName === userData.username && "self"
                                        }`}
                                        key={index}
                                    >
                                        {chat.senderName !== userData.username && (
                                            <div
                                                className="avatar"
                                                style={{
                                                    backgroundColor: avatarColors[chat.senderName],
                                                }}
                                            >
                                                {chat.senderName[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div className="message-info">
                                            <div className="sender-name">{chat.senderName}</div>
                                            <div className="message-data">{chat.message}</div>
                                        </div>
                                        {chat.senderName === userData.username && (
                                            <div
                                                className="avatar self"
                                                style={{
                                                    backgroundColor: avatarColors[userData.username],
                                                }}
                                            >
                                                {chat.senderName[0].toUpperCase()}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            <div className="send-message">
                                <input
                                    type="text"
                                    className="input-message"
                                    placeholder={`Digite uma mensagem para ${tab}`}
                                    value={userData.message}
                                    onChange={handleMessage}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            sendPrivateValue();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="send-button"
                                    onClick={sendPrivateValue}
                                >
                                    Enviar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="register">
                    <input
                        id="user-name"
                        name="username"
                        placeholder="Digite seu nome de usuário"
                        value={userData.username}
                        onChange={handleUsername}
                        onKeyPress={(e) => {
                            if (e.key === "Enter") {
                                loginUser();
                            }
                        }}
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Digite sua senha"
                        value={userData.password}
                        onChange={handleUsername}
                        onKeyPress={(e) => {
                            if (e.key === "Enter") {
                                loginUser();
                            }
                        }}
                    />
                    <button type="button" onClick={registerUser}>
                        Registrar
                    </button>
                    <button type="button" onClick={loginUser}>
                        Autenticar
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChatRoom;
