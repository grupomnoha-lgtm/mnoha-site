import { auth, db } from '/js/firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    getAuth,
    onAuthStateChanged,
    updatePassword,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const authContainer = document.getElementById('auth-container');
const userSessionContainer = document.getElementById('user-session-container');
const authModal = document.getElementById('auth-modal');
const modalContainer = document.getElementById('modal-container');

let registerAvatarImage = null;
let registerAvatarCrop = { x: 50, y: 50, zoom: 100 };

function updateRegisterAvatarPreview() {
    const preview = document.getElementById('avatar-crop-preview');
    if (!preview || !registerAvatarImage) return;

    preview.style.backgroundImage = `url(${registerAvatarImage.src})`;
    preview.style.backgroundPosition = `${registerAvatarCrop.x}% ${registerAvatarCrop.y}%`;
    preview.style.backgroundSize = `${registerAvatarCrop.zoom}%`;
    preview.style.backgroundRepeat = 'no-repeat';
}

async function getCroppedRegisterImageBlob() {
    if (!registerAvatarImage) return null;

    const canvasSize = 500;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    const img = registerAvatarImage;

    const baseScale = Math.max(canvasSize / img.naturalWidth, canvasSize / img.naturalHeight);
    const scale = baseScale * (registerAvatarCrop.zoom / 100);
    const renderWidth = img.naturalWidth * scale;
    const renderHeight = img.naturalHeight * scale;
    const x = (registerAvatarCrop.x / 100) * (canvasSize - renderWidth);
    const y = (registerAvatarCrop.y / 100) * (canvasSize - renderHeight);

    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.drawImage(img, x, y, renderWidth, renderHeight);

    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9));
}

function closeModal() {
    if (!authModal || !modalContainer) return;
    modalContainer.classList.add('scale-95', 'opacity-0');
    setTimeout(() => authModal.classList.add('hidden'), 300);
}

// Función para subir la imagen a ImgBB y actualizar el perfil del usuario
async function uploadUserProfileImage(file) {
    const IMGBB_API_KEY = "271b2d4c0437575b3ffab2168118d9d1";

    if (!file) {
        alert("Por favor, selecciona una imagen primero.");
        return null;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("album", "perfil");

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            const photoURL = data.data.url;

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL });
                await setDoc(doc(db, "users", auth.currentUser.uid), { photoURL }, { merge: true });
                alert("¡Foto de perfil actualizada con éxito!");

                const profileBtn = document.getElementById('profile-btn');
                if (profileBtn) {
                    profileBtn.innerHTML = `<img src="${photoURL}" alt="Avatar" class="w-full h-full object-cover" />`;
                }

                return photoURL;
            }
        } else {
            alert("Error al procesar la imagen en ImgBB.");
        }
    } catch (error) {
        console.error("Error al subir la imagen:", error);
        alert("Ocurrió un error de conexión al subir la imagen.");
    }

    return null;
}

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

function bindRegisterAvatarControls() {
    const fileInput = document.getElementById('register-photo');
    const posX = document.getElementById('avatar-pos-x');
    const posY = document.getElementById('avatar-pos-y');
    const zoom = document.getElementById('avatar-zoom');

    const updateCropValue = (field, value) => {
        registerAvatarCrop[field] = Number(value);
        updateRegisterAvatarPreview();
    };

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const imageUrl = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                registerAvatarImage = img;
                registerAvatarCrop = { x: 50, y: 50, zoom: 100 };
                if (posX) posX.value = '50';
                if (posY) posY.value = '50';
                if (zoom) zoom.value = '100';
                updateRegisterAvatarPreview();
            };
            img.src = imageUrl;
        });
    }

    if (posX) posX.addEventListener('input', (e) => updateCropValue('x', e.target.value));
    if (posY) posY.addEventListener('input', (e) => updateCropValue('y', e.target.value));
    if (zoom) zoom.addEventListener('input', (e) => updateCropValue('zoom', e.target.value));
}

if (formRegister) {
    bindRegisterAvatarControls();
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const birthdate = document.getElementById('register-birthday').value;
        const photoFile = document.getElementById('register-photo').files?.[0];
        const countryCode = document.getElementById('country-code').value;
        const phone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            let photoURL = null;

            if (photoFile) {
                const croppedBlob = await getCroppedRegisterImageBlob();
                photoURL = await uploadUserProfileImage(croppedBlob || photoFile);
            }

            await updateProfile(user, { displayName: username, ...(photoURL ? { photoURL } : {}) });

            try {
                await setDoc(doc(db, "users", user.uid), {
                    username: username,
                    email: email,
                    birthdate: birthdate || null,
                    photoURL: photoURL || null,
                    phone: countryCode + phone,
                    createdAt: new Date().toISOString()
                });
            } catch (firestoreError) {
                console.warn("No se pudo guardar datos adicionales en Firestore:", firestoreError);
                alert('¡Cuenta creada correctamente! No se pudieron guardar algunos datos adicionales del perfil porque Firestore no está disponible o no está configurado.');
                closeModal();
                return;
            }

            alert('¡Cuenta creada correctamente en Firebase!');
            closeModal();
        } catch (error) {
            console.error("Error al registrar:", error);
            alert('Error en el registro: ' + error.message);
        }
    });
}
