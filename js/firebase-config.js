import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7Ai9sFokxX67kdAGnHXeOxyFs2oOke8I",
  authDomain: "jisha-home-management-app.firebaseapp.com",
  projectId: "jisha-home-management-app",
  storageBucket: "jisha-home-management-app.firebasestorage.app",
  messagingSenderId: "238487301962",
  appId: "1:238487301962:web:12cf1ff8922908e2015bb3"
};

const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp);
