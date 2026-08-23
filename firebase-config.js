// Importa Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

// INSERISCI QUI LE TUE CREDENZIALI FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyClcKYpSRalLtakuzzYRglEjWCiH2leYuo",
  authDomain: "gb-league-2c735.firebaseapp.com",
  projectId: "gb-league-2c735",
  storageBucket: "gb-league-2c735.firebasestorage.app",
  messagingSenderId: "145800535191",
  appId: "1:145800535191:web:a0b7a057281ddbc48f5dd2"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Esporta per gli altri file
window.db = db;
window.collection = collection;
window.addDoc = addDoc;
window.getDocs = getDocs;
window.doc = doc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.query = query;
window.orderBy = orderBy;