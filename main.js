import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. Lógica de Autenticación y UI ---
function initializeAuth() {
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
    const openModal = () => {
        if (!authModal) return;
        authModal.classList.remove('hidden');
        setTimeout(() => {
            modalContainer.classList.remove('scale-95', 'opacity-0');
            modalContainer.classList.add('scale-100', 'opacity-100');
        }, 10);
    };

    const closeModal = () => {
        if (!authModal) return;
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
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
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
            const countryCode = document.getElementById('country-code').value;
            const phone = document.getElementById('register-phone').value;
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
        if (user) {
            authContainer.classList.add('hidden');
            userSessionContainer.classList.remove('hidden');
            userSessionContainer.innerHTML = `
                <span class="font-semibold text-sm text-gray-700">Hola, ${user.displayName || 'Usuario'}</span>
                <button id="logout-btn" class="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-xs tracking-widest hover:bg-red-600 transition-colors cursor-pointer">Salir</button>
            `;
            document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
        } else {
            userSessionContainer.classList.add('hidden');
            userSessionContainer.innerHTML = '';
            authContainer.classList.remove('hidden');
        }
    });
}

// --- 2. Lógica del Slider ---
function initializeSlider() {
    let slideIndex = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let slideTimer;

    function showSlide(index) {
        if (!slides.length || !dots.length) return;
        slideIndex = (index + slides.length) % slides.length;

        slides.forEach(slide => slide.classList.remove('opacity-100'));
        dots.forEach(dot => dot.classList.remove('w-7', 'bg-white', 'rounded-lg'));

        slides[slideIndex].classList.add('opacity-100');
        dots[slideIndex].classList.add('w-7', 'bg-white', 'rounded-lg');

        resetTimer();
    }

    function resetTimer() {
        clearInterval(slideTimer);
        slideTimer = setInterval(() => showSlide(slideIndex + 1), 5000);
    }

    window.moveSlide = (step) => showSlide(slideIndex + step);
    window.currentSlide = (index) => showSlide(index);

    showSlide(0);
}

// --- 3. Lógica de Traducción ---
function initializeTranslations() {
    const translations = {
        es: {
          slogan: "Soluciones Integrales", nav_home: "Inicio", nav_portfolios: "Portafolios", nav_about: "Nosotros", nav_contact: "Contacto", login_register_btn: "LOGIN / REGISTRO", login_title: "Iniciar Sesión", login_subtitle: "Accede a tu cuenta para continuar.", form_email: "Email", form_password: "Contraseña", login_btn: "ACCEDER", no_account: "¿No tienes una cuenta?", register_now: "Regístrate ahora", register_title: "Crear Cuenta", register_subtitle: "Únete a la comunidad MNOHA.", form_username: "Nombre de Usuario", form_phone: "Teléfono", register_btn: "CREAR CUENTA", has_account: "¿Ya tienes una cuenta?", login_now: "Inicia sesión", cta_button: "SOLICITAR SERVICIO", slide1_title: 'Tu Socio Integral en <span class="text-brand-orange">Soluciones</span>', slide1_desc: "Descubre nuestros portafolios diseñados para moverte, vestirte y conectarte.", slide1_button: "EXPLORAR PORTAFOLIOS", slide2_title: 'Elegancia y Estilo <span class="text-brand-orange">A Medida</span>', slide2_desc: "Diseños exclusivos y confección de alta costura para cada ocasión.", slide2_button: "VER SASTRERÍA", slide3_title: 'Formación y <span class="text-brand-orange">Excelencia</span>', slide3_desc: "Forjando el futuro académico con valores integrales y educación de calidad.", slide3_button: "VISITAR PORTAL EDUCATIVO", slide4_title: 'Rastreo y Seguridad <span class="text-brand-orange">GPS</span>', slide4_desc: "Monitoreo en tiempo real y control total para tu vehículo o flota.", slide4_button: "VER RASTREO GPS", portfolios_title: "Nuestros Portafolios", card1_title: "Movilidad Confiable", card1_desc: "Logística de transporte inteligente y servicios VIP con flota moderna.", card1_button: "VER MÁS - TAXIS", card2_title: "Elegancia a Medida", card2_desc: "Alta costura y diseño exclusivo con acabados de precisión artesanal.", card2_button: "VER MÁS - SASTRERÍA", card3_title: "Hub Educativo", card3_desc: "Forjando el futuro académico con excelencia y valores integrales.", card3_button: "VER PORTAL ↗", card4_title: "Control y Seguridad GPS", card4_desc: "Monitoreo en tiempo real para vehículos, flotas y activos con seguridad avanzada.", card4_button: "VER MÁS - GPS", footer_copyright: "© 2026 GRUPO MNOHA. Todos los derechos reservados.", footer_services: "Soluciones Integrales: Taxis | Sastrería | Educación | Rastreo GPS",
        },
        en: {
          slogan: "Integral Solutions", nav_home: "Home", nav_portfolios: "Portfolios", nav_about: "About Us", nav_contact: "Contact", login_register_btn: "LOGIN / REGISTER", login_title: "Sign In", login_subtitle: "Access your account to continue.", form_email: "Email", form_password: "Password", login_btn: "SIGN IN", no_account: "Don't have an account?", register_now: "Register now", register_title: "Create Account", register_subtitle: "Join the MNOHA community.", form_username: "Username", form_phone: "Phone Number", register_btn: "CREATE ACCOUNT", has_account: "Already have an account?", login_now: "Sign in", cta_button: "REQUEST SERVICE", slide1_title: 'Your Integral Partner in <span class="text-brand-orange">Solutions</span>', slide1_desc: "Discover our portfolios designed to move, dress, and connect you.", slide1_button: "EXPLORE PORTFOLIOS", slide2_title: 'Elegance and Style <span class="text-brand-orange">Tailored</span>', slide2_desc: "Exclusive designs and high-end tailoring for every occasion.", slide2_button: "VIEW TAILORING", slide3_title: 'Training and <span class="text-brand-orange">Excellence</span>', slide3_desc: "Forging the academic future with integral values and quality education.", slide3_button: "VISIT EDUCATION PORTAL", slide4_title: 'Tracking and Security <span class="text-brand-orange">GPS</span>', slide4_desc: "Real-time monitoring and full control for your vehicle or fleet.", slide4_button: "VIEW GPS TRACKING", portfolios_title: "Our Portfolios", card1_title: "Reliable Mobility", card1_desc: "Smart transport logistics and VIP services with a modern fleet.", card1_button: "SEE MORE - TAXIS", card2_title: "Tailored Elegance", card2_desc: "Haute couture and exclusive design with artisanal precision finishes.", card2_button: "SEE MORE - TAILORING", card3_title: "Education Hub", card3_desc: "Forging the academic future with excellence and integral values.", card3_button: "VISIT PORTAL ↗", card4_title: "GPS Control & Security", card4_desc: "Real-time monitoring for vehicles, fleets, and assets with advanced security.", card4_button: "SEE MORE - GPS", footer_copyright: "© 2026 GRUPO MNOHA. All rights reserved.", footer_services: "Integral Solutions: Taxis | Tailoring | Education | GPS Tracking",
        },
        fr: {
          slogan: "Solutions Intégrales", nav_home: "Accueil", nav_portfolios: "Portefeuilles", nav_about: "À Propos", nav_contact: "Contact", login_register_btn: "CONNEXION / S'INSCRIRE", login_title: "Se Connecter", login_subtitle: "Accédez à votre compte pour continuer.", form_email: "Email", form_password: "Mot de passe", login_btn: "SE CONNECTER", no_account: "Pas de compte ?", register_now: "Inscrivez-vous maintenant", register_title: "Créer un Compte", register_subtitle: "Rejoignez la communauté MNOHA.", form_username: "Nom d'utilisateur", form_phone: "Téléphone", register_btn: "CRÉER UN COMPTE", has_account: "Vous avez déjà un compte ?", login_now: "Connectez-vous", cta_button: "DEMANDER UN SERVICE", slide1_title: 'Votre Partenaire Intégral en <span class="text-brand-orange">Solutions</span>', slide1_desc: "Découvrez nos portefeuilles conçus pour vous déplacer, vous habiller et vous connecter.", slide1_button: "EXPLORER LES PORTEFEUILLES", slide2_title: 'Élégance et Style <span class="text-brand-orange">Sur Mesure</span>', slide2_desc: "Designs exclusifs et confection haute couture pour chaque occasion.", slide2_button: "VOIR LA COUTURE", slide3_title: 'Formation et <span class="text-brand-orange">Excellence</span>', slide3_desc: "Forger l'avenir académique avec des valeurs intégrales et une éducation de qualité.", slide3_button: "VISITER LE PORTAIL ÉDUCATIF", slide4_title: 'Suivi et Sécurité <span class="text-brand-orange">GPS</span>', slide4_desc: "Surveillance en temps réel et contrôle total pour votre véhicule ou votre flotte.", slide4_button: "VOIR LE SUIVI GPS", portfolios_title: "Nos Portefeuilles", card1_title: "Mobilité Fiable", card1_desc: "Logistique de transport intelligente et services VIP avec une flotte moderne.", card1_button: "VOIR PLUS - TAXIS", card2_title: "Élégance Sur Mesure", card2_desc: "Haute couture et design exclusif avec des finitions de précision artisanale.", card2_button: "VOIR PLUS - COUTURE", card3_title: "Pôle Éducatif", card3_desc: "Forger l'avenir académique avec excellence et valeurs intégrales.", card3_button: "VISITER LE PORTAIL ↗", card4_title: "Contrôle et Sécurité GPS", card4_desc: "Surveillance en temps réel pour véhicules, flottes et actifs avec sécurité avancée.", card4_button: "VOIR PLUS - GPS", footer_copyright: "© 2026 GRUPO MNOHA. Tous droits réservés.", footer_services: "Solutions Intégrales: Taxis | Couture | Éducation | Suivi GPS",
        }
    };

    const langSwitcherBtn = document.getElementById('lang-switcher-btn');
    const langDropdown = document.getElementById('lang-dropdown');
    const currentLangText = document.getElementById('current-lang-text');

    const setLanguage = (lang) => {
        const translation = translations[lang];
        if (!translation) return;

        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (translation[key]) {
                el.innerHTML = translation[key];
            }
        });
        document.documentElement.lang = lang;
        if (currentLangText) currentLangText.textContent = lang.toUpperCase();
        if (langDropdown) langDropdown.classList.add('hidden');
    };

    if (langSwitcherBtn) {
        langSwitcherBtn.addEventListener('click', () => langDropdown.classList.toggle('hidden'));
    }

    document.addEventListener('click', (e) => {
        if (langSwitcherBtn && !langSwitcherBtn.contains(e.target) && langDropdown && !langDropdown.contains(e.target)) {
            langDropdown.classList.add('hidden');
        }
        if (e.target.tagName === 'A' && e.target.dataset.lang) {
            e.preventDefault();
            setLanguage(e.target.dataset.lang);
        }
    });

    const userLang = navigator.language.slice(0, 2);
    const initialLang = translations[userLang] ? userLang : 'es';
    setLanguage(initialLang);
}

// --- Inicialización General ---
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeSlider();
    initializeTranslations();
});