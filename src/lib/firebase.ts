import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 
// 👈 Añade esta importación


// 🕵️‍♂️ CHIVATO TEMPORAL: Vamos a ver qué está leyendo Vite
console.log("🔥 Mi API KEY es:", import.meta.env.VITE_FIREBASE_API_KEY);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dev-api-key-placeholder",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dev-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dev-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dev-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Solo inicializar Firebase si tenemos una API key válida
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn("⚠️ Firebase no inicializado - usando modo desarrollo sin Firebase");
}

export { app, auth, db, storage };