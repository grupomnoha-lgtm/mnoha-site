import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCV7juPu5q5G9CV3cLXV99SrwVotqkawJY",
  authDomain: "mnoha-500cd.firebaseapp.com",
  projectId: "mnoha-500cd",
  storageBucket: "mnoha-500cd.firebasestorage.app",
  messagingSenderId: "298478644966",
  appId: "1:298478644966:web:ef4076a029494a7927d527"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);