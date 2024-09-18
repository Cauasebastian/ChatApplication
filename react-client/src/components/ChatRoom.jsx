import React, { useEffect, useState } from 'react';
import { over } from 'stompjs';
import SockJS from 'sockjs-client';
import './ChatRoom.css';

let stompClient = null;

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
    const [connectedUsers, setConnectedUsers] = useState([]);

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
        const Sock = new SockJS('http://localhost:8080/ws');
        stompClient = over(Sock);
        stompClient.connect({
            'Authorization': 'Basic ' + btoa(`${userData.username}:${userData.password}`)
        }, onConnected, onError);
    };

    const onConnected = () => {
        setUserData(prevData => ({ ...prevData, connected: true }));
        stompClient.subscribe('/chatroom/public', onMessageReceived);
        stompClient.subscribe('/user/' + userData.username + '/private', onPrivateMessage);

        // Enviar mensagem de JOIN
        userJoin();

        // Buscar mensagens antigas
        fetchOldMessages();
    };

    const fetchOldMessages = () => {
        // Buscar mensagens públicas
        fetch('http://localhost:8080/messages/public', {
            headers: {
                'Authorization': 'Basic ' + btoa(`${userData.username}:${userData.password}`)
            }
        })
            .then(res => res.json())
            .then(data => {
                // Ordenar mensagens por data
                data.sort((a, b) => new Date(a.date) - new Date(b.date));
                setPublicChats(prevChats => [...prevChats, ...data]);

                // Definir cores de avatar para usuários das mensagens públicas
                data.forEach(message => {
                    if (!avatarColors[message.senderName]) {
                        setAvatarColors(prevColors => ({
                            ...prevColors,
                            [message.senderName]: generateRandomColor()
                        }));
                    }
                });
            })
            .catch(error => console.error('Erro ao buscar mensagens públicas:', error));

        // Buscar mensagens privadas para o usuário
        fetch('http://localhost:8080/messages/private', {
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

                    // Definir cores de avatar para usuários das mensagens privadas
                    if (!avatarColors[chatUser]) {
                        setAvatarColors(prevColors => ({
                            ...prevColors,
                            [chatUser]: generateRandomColor()
                        }));
                    }
                });

                // Ordenar mensagens em cada chat privado por data
                chats.forEach((messages, user) => {
                    messages.sort((a, b) => new Date(a.date) - new Date(b.date));
                });

                setPrivateChats(chats);
            })
            .catch(error => console.error('Erro ao buscar mensagens privadas:', error));
    };

    const userJoin = () => {
        const chatMessage = {
            senderName: userData.username,
            status: "JOIN"
        };
        stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    };

    const userLeave = () => {
        const chatMessage = {
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

    // Função para receber mensagens públicas
const onMessageReceived = (payload) => {
    const payloadData = JSON.parse(payload.body);

    // Verifica se a mensagem é de JOIN ou LEAVE
    if (payloadData.status === "JOIN") {
        setConnectedUsers(prevUsers => {
            if (!prevUsers.includes(payloadData.senderName)) {
                return [...prevUsers, payloadData.senderName];
            }
            return prevUsers;
        });

        // Adiciona uma mensagem de notificação de que o usuário entrou
        setPublicChats(prevChats => [...prevChats, {
            senderName: "Sistema", // Pode ser qualquer nome para indicar uma notificação do sistema
            message: `${payloadData.senderName} entrou no chat.`,
            status: "NOTIFICATION"
        }]);
    } else if (payloadData.status === "LEAVE") {
        setConnectedUsers(prevUsers => prevUsers.filter(user => user !== payloadData.senderName));

        // Adiciona uma mensagem de notificação de que o usuário saiu
        setPublicChats(prevChats => [...prevChats, {
            senderName: "Sistema",
            message: `${payloadData.senderName} saiu do chat.`,
            status: "NOTIFICATION"
        }]);
    } else if (payloadData.status === "MESSAGE") {
        setPublicChats(prevChats => [...prevChats, payloadData]);
    }
};


    // Função para receber mensagens privadas
    const onPrivateMessage = (payload) => {
        const payloadData = JSON.parse(payload.body);
        const sender = payloadData.senderName;

        setPrivateChats(prevChats => {
            const newChats = new Map(prevChats);
            if (newChats.get(sender)) {
                newChats.get(sender).push(payloadData);
            } else {
                newChats.set(sender, [payloadData]);
            }
            return newChats;
        });

        if (!avatarColors[sender]) {
            setAvatarColors(prevColors => ({
                ...prevColors,
                [sender]: generateRandomColor()
            }));
        }
    };

    const onError = (err) => {
        console.error('Erro no STOMP:', err);
    };

    const handleMessage = (event) => {
        const { value } = event.target;
        setUserData(prevData => ({ ...prevData, message: value }));
    };

    const sendValue = () => {
        if (stompClient && userData.message.trim() !== "") {
            const chatMessage = {
                senderName: userData.username,
                message: userData.message,
                status: "MESSAGE"
            };
            stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
            setUserData(prevData => ({ ...prevData, message: "" }));
        }
    };

    const sendPrivateValue = () => {
        if (stompClient && userData.message.trim() !== "") {
            const chatMessage = {
                senderName: userData.username,
                receiverName: tab,
                message: userData.message,
                status: "MESSAGE"
            };

            if (userData.username !== tab) {
                setPrivateChats(prevChats => {
                    const newChats = new Map(prevChats);
                    if (newChats.get(tab)) {
                        newChats.get(tab).push(chatMessage);
                    } else {
                        newChats.set(tab, [chatMessage]);
                    }
                    return newChats;
                });
            }
            stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
            setUserData(prevData => ({ ...prevData, message: "" }));
        }
    };

    const handleUsername = (event) => {
        const { value, name } = event.target;
        setUserData(prevData => ({ ...prevData, [name]: value }));
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
                                className={`member ${tab === "CHATROOM" ? "active" : ""}`}
                            >
                                Chatroom
                            </li>
                            {connectedUsers.map((name, index) => (
                                <li
                                    onClick={() => setTab(name)}
                                    className={`member ${tab === name ? "active" : ""}`}
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
    {publicChats.map((chat, index) => {
        // Verifica se a mensagem ou notificação tem conteúdo válido
        if (!chat.message && chat.status !== "NOTIFICATION") {
            return null; // Não renderiza o item se não houver conteúdo
        }

        return (
            <li
                className={`message ${chat.senderName === userData.username ? "self" : ""}`}
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
                    // Renderiza a notificação apenas se a mensagem não estiver vazia
                    chat.message && (
                        <div className="notification">
                            {chat.message}
                        </div>
                    )
                )}
            </li>
        );
    })}
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
                                {publicChats.map((chat, index) => (
                                    <li
                                        className={`message ${chat.senderName === userData.username ? "self" : ""}`}
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
                // Exibe notificação de JOIN ou LEAVE
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
