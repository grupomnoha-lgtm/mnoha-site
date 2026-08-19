// js/chat.js - Chat estructurado por documento único por usuario
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    arrayUnion, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    let unsubscribeMessages = null;
    let activeSessionId;

    // Elementos del DOM del chat
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
        closeChat(); 
        const authModal = document.getElementById('auth-modal');
        const modalContainer = document.getElementById('modal-container');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (!authModal || !modalContainer) return;

        authModal.classList.remove('hidden');
        if (isLogin) {
            if (loginForm) loginForm.classList.remove('hidden');
            if (registerForm) registerForm.classList.add('hidden');
        } else {
            if (loginForm) loginForm.classList.add('hidden');
            if (registerForm) registerForm.classList.remove('hidden');
        }

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
            
            loadChatHistory(user);
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
                
                document.getElementById('chat-login-btn')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    openAuthModal(true);
                });
                
                document.getElementById('chat-register-btn')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    openAuthModal(false);
                });
            }
        }
    };

    window.addEventListener('mnoha-auth-state-changed', (event) => {
        updateChatAuthState(event.detail?.user || null);
    });
    onAuthStateChanged(auth, updateChatAuthState);

    // --- Cargar historial desde el documento único del usuario ---
    function loadChatHistory(user) {
        const docRef = doc(db, "conversations", user.uid);

        if (unsubscribeMessages) unsubscribeMessages();

        unsubscribeMessages = onSnapshot(docRef, async (docSnap) => {
            if (!chatMessages) return;
            
            chatMessages.innerHTML = '<div class="text-xs text-gray-500 text-center my-2">Canal de soporte directo MNOHA</div>';
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                const messages = data.messages || [];

                messages.forEach((msg) => {
                    const isClient = msg.sender === 'client';
                    const msgDiv = document.createElement('div');
                    msgDiv.className = `message ${isClient ? 'sent' : 'received'}`;
                    msgDiv.innerHTML = `<p>${msg.text}</p>`;
                    chatMessages.appendChild(msgDiv);
                });
            } else {
                // Si el documento aún no existe, lo inicializamos vacío
                await setDoc(docRef, {
                    sessionId: user.uid,
                    userName: user.displayName || 'Cliente',
                    userEmail: user.email,
                    messages: [],
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, (error) => {
            console.error('Error al escuchar la conversación:', error);
            if (chatMessages) {
                chatMessages.innerHTML = '<p class="text-sm text-red-600 text-center">No se pudieron cargar los mensajes.</p>';
            }
        });
    }

    // --- Enviar mensaje (Añade al array dentro del documento del usuario) ---
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = currentUser || auth.currentUser;
            if (!user || !chatInput) return;

            const text = chatInput.value.trim();
            if (!text) return;

            chatInput.value = ''; 
            
            const docRef = doc(db, "conversations", user.uid);

            try {
                await updateDoc(docRef, {
                    messages: arrayUnion({
                        text: text,
                        sender: 'client',
                        createdAt: new Date().toISOString()
                    }),
                    updatedAt: serverTimestamp(),
                    userEmail: user.email,
                    userName: user.displayName || 'Cliente'
                });
            } catch (error) {
                console.error("Error al enviar mensaje:", error);
            }
        });
    }
});