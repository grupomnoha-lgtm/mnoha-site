// chat.js - Chat vinculado a Firebase Authentication
import { auth, db } from './firebase-config.js'; // <-- Cambio clave: importamos auth desde TU configuración
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
    const chatCloseBtn = document.getElementById('chat-close-btn') || document.getElementById('close-chat-btn');
    const chatPanel = document.getElementById('chat-panel') || document.getElementById('chat-window');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatSubmitBtn = chatForm ? chatForm.querySelector('button') : null;

    // Elementos del Modal de Autenticación de la página web
    const authModal = document.getElementById('auth-modal');
    const modalContainer = document.getElementById('modal-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Abrir / Cerrar panel de chat
    if (chatToggleBtn && chatPanel) {
        chatToggleBtn.addEventListener('click', () => chatPanel.classList.toggle('hidden'));
    }
    if (chatCloseBtn && chatPanel) {
        chatCloseBtn.addEventListener('click', () => chatPanel.classList.add('hidden'));
    }

    // Función para abrir el modal desde los botones del chat
    const openAuthModal = (isLogin) => {
        if (authModal && modalContainer) {
            authModal.classList.remove('hidden');
            setTimeout(() => {
                modalContainer.classList.remove('scale-95', 'opacity-0');
                modalContainer.classList.add('scale-100', 'opacity-100');
            }, 10);
            
            // Mostrar formulario de Login o Registro
            if (isLogin) {
                if (loginForm) loginForm.classList.remove('hidden');
                if (registerForm) registerForm.classList.add('hidden');
            } else {
                if (loginForm) loginForm.classList.add('hidden');
                if (registerForm) registerForm.classList.remove('hidden');
            }
        }
    };

    // 1. Escuchar si el usuario inicia o cierra sesión
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            // Usuario conectado
            if (chatInput) {
                chatInput.placeholder = "Escribe tu mensaje...";
                chatInput.disabled = false;
            }
            if (chatSubmitBtn) chatSubmitBtn.disabled = false;
            
            loadChatHistory(user.uid);
        } else {
            // Usuario no conectado
            if (unsubscribeMessages) unsubscribeMessages();
            
            if (chatInput) {
                chatInput.placeholder = "Inicia sesión para escribir...";
                chatInput.disabled = true;
            }
            if (chatSubmitBtn) chatSubmitBtn.disabled = true;
            
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full space-y-4 mt-8">
                        <p class="text-sm text-gray-600 text-center px-4">Debes acceder a tu cuenta para contactar con soporte.</p>
                        <button id="chat-login-btn" type="button" class="bg-[#2a5298] text-white px-6 py-2 rounded-full font-bold text-xs hover:bg-[#1e3c72] w-4/5 transition-colors shadow-md cursor-pointer">ACCEDER</button>
                        <button id="chat-register-btn" type="button" class="bg-transparent border border-[#2a5298] text-[#2a5298] px-6 py-2 rounded-full font-bold text-xs hover:bg-slate-100 w-4/5 transition-colors cursor-pointer">REGISTRARSE</button>
                    </div>`;
                
                document.getElementById('chat-login-btn').addEventListener('click', () => openAuthModal(true));
                document.getElementById('chat-register-btn').addEventListener('click', () => openAuthModal(false));
            }
        }
    });

    // Función para cargar los mensajes de este usuario
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
                msgDiv.className = `flex ${isClient ? 'justify-end' : 'justify-start'} mb-2`;
                msgDiv.innerHTML = `
                    <div class="max-w-[75%] px-3 py-2 rounded-2xl text-xs ${
                        isClient 
                            ? 'bg-[#2a5298] text-white rounded-br-none' 
                            : 'bg-white border border-slate-200 text-gray-800 rounded-bl-none shadow-sm'
                    }">
                        <p>${data.text}</p>
                    </div>
                `;
                chatMessages.appendChild(msgDiv);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    // 2. Enviar mensaje a Firestore
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // <-- ESTO EVITA QUE LA PÁGINA SE ACTUALICE
            
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