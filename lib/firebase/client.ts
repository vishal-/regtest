import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBz0hZPK-gsisn5_pjkI85BPrrGfTLUzUY",
  authDomain: "regtest-poovi-co-in.firebaseapp.com",
  projectId: "regtest-poovi-co-in",
  storageBucket: "regtest-poovi-co-in.firebasestorage.app",
  messagingSenderId: "990768350183",
  appId: "1:990768350183:web:da4f649a285e8f25a13342"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
