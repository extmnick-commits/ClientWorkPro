import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBlFtO4evfY70FINL-sCS1biePPtZ22AO0",
  authDomain: "clientworktracker-f78fe.firebaseapp.com",
  projectId: "clientworktracker-f78fe",
  storageBucket: "clientworktracker-f78fe.firebasestorage.app",
  messagingSenderId: "483745166375",
  appId: "1:483745166375:web:e30e2052d69d237ed00a02"
};

const app = initializeApp(firebaseConfig);

// THIS LINE IS THE KEY: It exports 'db' so your tabs can use it
export const db = getFirestore(app);