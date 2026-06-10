import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, addDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cat-maester.firebaseapp.com",
  projectId: "cat-maester",
  storageBucket: "cat-maester.firebasestorage.app",
  messagingSenderId: "1008103609579",
  appId: "1:1008103609579:web:d2386f871f63a697bd9aae",
  measurementId: "G-6VP9DDW9YH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, addDoc, updateDoc, onSnapshot };