// chat.js - Chat vinculado a Firebase Authentication
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
    let activeSessionId;

    // Elementos del DOM del chat (estos sí son seguros de buscar al cargar)
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatCloseBtn = document.getElementById('close-chat-btn') || document.getElementById('chat-close-btn');
    const chatPanel = document.getElementById('chat-window') || document.getElementById('chat-panel');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatSubmitBtn = chatForm ? chatForm.querySelector('button[type="submit"]') : null;

    // --- Control de apertura y cierre del panel de chat ---
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

    // --- Función para abrir el modal desde los botones del chat ---
    const openAuthModal = (isLogin) => {
        // 1. Cerramos el chat para despejar la vista
        closeChat(); 

        // 2. Buscamos los elementos del modal AHORA MISMO, para asegurarnos de que existen
        const authModal = document.getElementById('auth-modal');
        const modalContainer = document.getElementById('modal-container');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (!authModal || !modalContainer) {
            console.error("Error: No se encontró el modal de autenticación en el HTML.");
            return;
        }

        // 3. Mostramos el contenedor principal del modal
        authModal.classList.remove('hidden');
        
        // 4. Alternamos entre Login y Registro antes de animar
        if (isLogin) {
            if (loginForm) loginForm.classList.remove('hidden');
            if (registerForm) registerForm.classList.add('hidden');
        } else {
            if (loginForm) loginForm.classList.add('hidden');
            if (registerForm) registerForm.classList.remove('hidden');
        }

        // 5. Aplicamos la animación (igual que en auth.js)
        setTimeout(() => {
            modalContainer.classList.remove('scale-95', 'opacity-0');
            modalContainer.classList.add('scale-100', 'opacity-100');
        }, 10);
    };

    const updateChatAuthState = (user) => {
        const nextSessionId = user?.uid || null;
        if (nextSessionId === activeSessionId) return;

        activeSessionId = nextSessionId;
        currentUser = user;
        if (user) {
            if (chatInput) {
                chatInput.placeholder = "Escribe tu mensaje...";
                chatInput.disabled = false;
            }
            if (chatSubmitBtn) chatSubmitBtn.disabled = false;
            if (chatForm) chatForm.classList.remove('pointer-events-none', 'opacity-60');
            
            loadChatHistory(user.uid);
        } else {
            if (unsubscribeMessages) unsubscribeMessages();
            
            if (chatInput) {
                chatInput.placeholder = "Inicia sesión para escribir...";
                chatInput.disabled = true;
            }
            if (chatSubmitBtn) chatSubmitBtn.disabled = true;
            if (chatForm) chatForm.classList.add('pointer-events-none', 'opacity-60');
            
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full space-y-4 my-auto py-8">
                        <p class="text-sm text-gray-600 text-center px-4">Debes acceder a tu cuenta para contactar con soporte.</p>
                        <button id="chat-login-btn" type="button" class="bg-[#2a5298] text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-[#1e3c72] w-4/5 transition-colors shadow-md cursor-pointer">ACCEDER</button>
                        <button id="chat-register-btn" type="button" class="bg-transparent border border-[#2a5298] text-[#2a5298] px-6 py-2.5 rounded-full font-bold text-xs hover:bg-slate-100 w-4/5 transition-colors cursor-pointer">REGISTRARSE</button>
                    </div>`;
                
                // Añadimos los event listeners a los botones recién inyectados
                const loginBtn = document.getElementById('chat-login-btn');
                const registerBtn = document.getElementById('chat-register-btn');
                
                if (loginBtn) {
                    loginBtn.addEventListener('click', (e) => {
                        e.preventDefault(); // Evita comportamientos extraños del botón
                        openAuthModal(true);
                    });
                }
                
                if (registerBtn) {
                    registerBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        openAuthModal(false);
                    });
                }
            }
        }
    };

    // Firebase notifica tanto el inicio como el cierre de sesión sin recargar la página.
    window.addEventListener('mnoha-auth-state-changed', (event) => {
        updateChatAuthState(event.detail?.user || null);
    });
    onAuthStateChanged(auth, updateChatAuthState);

    // --- Cargar historial de mensajes ---
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
        }, (error) => {
            console.error('Error al escuchar los mensajes del chat:', error);
            if (chatMessages) {
                chatMessages.innerHTML = '<p class="text-sm text-red-600 text-center">No se pudieron cargar los mensajes.</p>';
            }
        });
    }

    // --- Enviar mensaje ---
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = currentUser || auth.currentUser;
            if (!user || !chatInput) return;

            const text = chatInput.value.trim();
            if (!text) return;

            chatInput.value = ''; 
            
            try {
                await addDoc(collection(db, "chats"), {
                    sessionId: user.uid,
                    userName: user.displayName || 'Cliente',
                    userEmail: user.email,
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