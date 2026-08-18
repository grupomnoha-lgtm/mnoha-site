// chat.js - Chat vinculado a Firebase Authentication con apertura directa de modales
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    let unsubscribeMessages = null;

    // Elementos del DOM del chat
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatCloseBtn = document.getElementById('close-chat-btn') || document.getElementById('chat-close-btn');
    const chatPanel = document.getElementById('chat-window') || document.getElementById('chat-panel');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatSubmitBtn = chatForm ? chatForm.querySelector('button[type="submit"]') : null;

    // Elementos del Modal de Autenticación de la página web
    const authModal = document.getElementById('auth-modal');
    const modalContainer = document.getElementById('modal-container') || (authModal ? authModal.querySelector('div') : null);
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Funciones explícitas para abrir / cerrar la ventana de chat
    const openChat = () => {
        if (chatPanel) {
            chatPanel.classList.remove('hidden');
            chatPanel.style.display = 'flex';
        }
    };

    const closeChat = (e) => {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        if (chatPanel) {
            chatPanel.classList.add('hidden');
            chatPanel.style.display = 'none';
        }
    };

    const toggleChat = () => {
        if (!chatPanel) return;
        const isHidden = chatPanel.classList.contains('hidden') || chatPanel.style.display === 'none';
        if (isHidden) {
            openChat();
        } else {
            closeChat();
        }
    };

    if (chatToggleBtn) chatToggleBtn.addEventListener('click', toggleChat);
    if (chatCloseBtn) chatCloseBtn.addEventListener('click', closeChat);

    // Función definitiva para abrir el modal desde los botones del chat
    const openAuthModal = (isLogin) => {
        closeChat(); // Cerramos el chat para despejar la pantalla

        if (authModal) {
            // 1. Forzar visibilidad y capa superior máxima
            authModal.classList.remove('hidden');
            authModal.style.display = 'flex';
            authModal.style.zIndex = '99999';

            // 2. Asegurar que el contenedor interno sea visible
            if (modalContainer) {
                modalContainer.classList.remove('scale-95', 'opacity-0');
                modalContainer.classList.add('scale-100', 'opacity-100');
                modalContainer.style.opacity = '1';
                modalContainer.style.transform = 'scale(1)';
                modalContainer.style.display = 'block';
            }

            // 3. Alternar entre formulario de Login o Registro
            if (isLogin) {
                if (loginForm) {
                    loginForm.classList.remove('hidden');
                    loginForm.style.display = 'block';
                }
                if (registerForm) {
                    registerForm.classList.add('hidden');
                    registerForm.style.display = 'none';
                }
            } else {
                if (loginForm) {
                    loginForm.classList.add('hidden');
                    loginForm.style.display = 'none';
                }
                if (registerForm) {
                    registerForm.classList.remove('hidden');
                    registerForm.style.display = 'block';
                }
            }
        }
    };

    // 1. Escuchar el estado de autenticación
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            if (chatInput) {
                chatInput.placeholder = "Escribe tu mensaje...";
                chatInput.disabled = false;
            }
            if (chatSubmitBtn) chatSubmitBtn.disabled = false;
            
            loadChatHistory(user.uid);
        } else {
            if (unsubscribeMessages) unsubscribeMessages();
            
            if (chatInput) {
                chatInput.placeholder = "Inicia sesión para escribir...";
                chatInput.disabled = true;
            }
            if (chatSubmitBtn) chatSubmitBtn.disabled = true;
            
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full space-y-4 my-auto py-8">
                        <p class="text-sm text-gray-600 text-center px-4">Debes acceder a tu cuenta para contactar con soporte.</p>
                        <button id="chat-login-btn" type="button" class="bg-[#2a5298] text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-[#1e3c72] w-4/5 transition-colors shadow-md cursor-pointer">ACCEDER</button>
                        <button id="chat-register-btn" type="button" class="bg-transparent border border-[#2a5298] text-[#2a5298] px-6 py-2.5 rounded-full font-bold text-xs hover:bg-slate-100 w-4/5 transition-colors cursor-pointer">REGISTRARSE</button>
                    </div>`;
                
                document.getElementById('chat-login-btn')?.addEventListener('click', () => openAuthModal(true));
                document.getElementById('chat-register-btn')?.addEventListener('click', () => openAuthModal(false));
            }
        }
    });

    // Cargar historial de mensajes
    function loadChatHistory(uid) {
        const messagesRef = collection(db, "chats");
        const q = query(messagesRef, where("sessionId", "==", uid), orderBy("createdAt", "asc"));

        if (unsubscribeMessages) unsubscribeMessages();

        unsubscribeMessages = onSnapshot(q, (snapshot) => {
            if (!chatMessages) return;
            
            chatMessages.innerHTML = '<div class="text-xs text-gray-500 text-center my-2">Canal de soporte directo MNOHA</div>';
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                const isClient = data.sender === 'client';
                
                const msgDiv = document.createElement('div');
                msgDiv.className = `message ${isClient ? 'sent' : 'received'}`;
                msgDiv.innerHTML = `<p>${data.text}</p>`;
                chatMessages.appendChild(msgDiv);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    // Enviar mensaje
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) return;

            const text = chatInput.value.trim();
            if (!text) return;

            chatInput.value = ''; 
            
            try {
                await addDoc(collection(db, "chats"), {
                    sessionId: currentUser.uid,            
                    userName: currentUser.displayName || 'Cliente', 
                    userEmail: currentUser.email,          
                    text: text,
                    sender: 'client',
                    createdAt: serverTimestamp()
                });
            } catch (error) {
                console.error("Error al enviar mensaje:", error);
            }
        });
    }
});