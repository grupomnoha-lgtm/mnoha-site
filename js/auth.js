// js/auth.js
import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function initializeAuth() {
    // Elementos del DOM para autenticación
    const authContainer = document.getElementById('auth-container');
    const userSessionContainer = document.getElementById('user-session-container');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    // Elementos del DOM para el modal
    const authModal = document.getElementById('auth-modal');
    const modalContainer = document.getElementById('modal-container');
    const loginModalBtn = document.getElementById('login-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register-form');
    const showLoginLink = document.getElementById('show-login-form');

    // --- Funciones del Modal ---
    export const openModal = () => {
        if (!authModal) return;
        authModal.classList.remove('hidden');
        setTimeout(() => {
            if (modalContainer) {
                modalContainer.classList.remove('scale-95', 'opacity-0');
                modalContainer.classList.add('scale-100', 'opacity-100');
            }
        }, 10);
    };

    const closeModal = () => {
        if (!authModal || !modalContainer) return;
        modalContainer.classList.add('scale-95', 'opacity-0');
        setTimeout(() => authModal.classList.add('hidden'), 300);
    };

    // --- Event Listeners del Modal ---
    if (loginModalBtn) loginModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (authModal) authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeModal();
    });
    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
    });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (registerForm) registerForm.classList.add('hidden');
        if (loginForm) loginForm.classList.remove('hidden');
    });

    // --- Lógica de Firebase ---
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                alert('¡Inicio de sesión exitoso!');
                closeModal();
            } catch (error) {
                console.error("Error al iniciar sesión:", error);
                alert('Error al acceder: Comprueba que el correo y contraseña sean correctos.');
            }
        });
    }

    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const countryCode = document.getElementById('country-code')?.value || '';
            const phone = document.getElementById('register-phone')?.value || '';
            const password = document.getElementById('register-password').value;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await updateProfile(user, { displayName: username });
                await setDoc(doc(db, "users", user.uid), {
                    username: username,
                    email: email,
                    phone: countryCode + phone,
                    createdAt: new Date().toISOString()
                });
                alert('¡Cuenta creada correctamente!');
                closeModal();
            } catch (error) {
                console.error("Error al registrar:", error);
                const message = error.code === 'auth/email-already-in-use' ? 'El correo electrónico ya está registrado.'
                    : error.code === 'auth/weak-password' ? 'La contraseña debe tener al menos 6 caracteres.'
                    : 'Error en el registro: ' + error.message;
                alert(message);
            }
        });
    }

    onAuthStateChanged(auth, (user) => {
        if (!authContainer || !userSessionContainer) return;
        if (user) {
            authContainer.classList.add('hidden');
            userSessionContainer.classList.remove('hidden');
            userSessionContainer.innerHTML = `
                <span class="font-semibold text-sm text-gray-700">Hola, ${user.displayName || 'Usuario'}</span>
                <button id="logout-btn" class="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-xs tracking-widest hover:bg-red-600 transition-colors cursor-pointer">Salir</button>
            `;
            const logoutBtn = document.getElementById('logout-btn');
            if(logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));
        } else {
            userSessionContainer.classList.add('hidden');
            userSessionContainer.innerHTML = '';
            authContainer.classList.remove('hidden');
        }
    });
}