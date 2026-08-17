// js/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

// --- DOM Elements ---
const authModal = document.getElementById("auth-modal");
const modalContent = authModal.querySelector("div");
const loginModalBtn = document.getElementById("login-modal-btn");
const closeModalBtn = document.getElementById("close-modal-btn");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const showRegisterLink = document.getElementById("show-register-form");
const showLoginLink = document.getElementById("show-login-form");

const authContainer = document.getElementById("auth-container");
const userSessionContainer = document.getElementById("user-session-container");

const registerSubmitBtn = document.getElementById("register-submit-btn");
const loginSubmitBtn = document.getElementById("login-submit-btn");

// --- Modal Logic ---
const openModal = () => {
  authModal.classList.remove("hidden");
  setTimeout(() => {
    modalContent.classList.remove("scale-95", "opacity-0");
    modalContent.classList.add("scale-100", "opacity-100");
  }, 10);
};

const closeModal = () => {
  modalContent.classList.add("scale-95", "opacity-0");
  setTimeout(() => authModal.classList.add("hidden"), 300);
};

// --- UI Updates ---
const updateUIForLogin = (user) => {
  authContainer.classList.add("hidden");
  userSessionContainer.classList.remove("hidden");
  userSessionContainer.innerHTML = `
        <span class="font-semibold text-sm text-gray-700">Hola, ${user.displayName || 'Usuario'}</span>
        <button id="logout-btn" class="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-xs tracking-widest hover:bg-red-600 transition-colors">Salir</button>
    `;
  document.getElementById("logout-btn").addEventListener("click", handleLogout);
};

const updateUIForLogout = () => {
  userSessionContainer.classList.add("hidden");
  userSessionContainer.innerHTML = "";
  authContainer.classList.remove("hidden");
};

// --- Firebase Auth Handlers ---
const handleRegister = async (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Actualizar el perfil del usuario con su nombre
    await updateProfile(userCredential.user, {
      displayName: username,
    });
    alert("¡Registro exitoso! Se ha iniciado sesión automáticamente.");
    closeModal();
  } catch (error) {
    console.error("Error en el registro:", error);
    alert(`Error en el registro: ${error.message}`);
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("¡Inicio de sesión exitoso!");
    closeModal();
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    alert(`Error en el inicio de sesión: ${error.message}`);
  }
};

const handleLogout = async () => {
  try {
    await signOut(auth);
    alert("Has cerrado la sesión.");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    alert(`Error al cerrar sesión: ${error.message}`);
  }
};

// --- Event Listeners ---
loginModalBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
authModal.addEventListener("click", (e) => {
  if (e.target === authModal) closeModal();
});

showRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
});

showLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

registerSubmitBtn.addEventListener("click", handleRegister);
loginSubmitBtn.addEventListener("click", handleLogin);

// --- Auth State Observer ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    // El usuario ha iniciado sesión
    console.log("Usuario conectado:", user);
    updateUIForLogin(user);
  } else {
    // El usuario ha cerrado sesión
    console.log("Usuario desconectado.");
    updateUIForLogout();
  }
});