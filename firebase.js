import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyCWdVoqKvragRGBip8ALxtYezNUx3JCpiA",
    authDomain: "versionlearn-e22a5.firebaseapp.com",
    projectId: "versionlearn-e22a5",
    storageBucket: "versionlearn-e22a5.firebasestorage.app",
    messagingSenderId: "119029786969",
    appId: "1:119029786969:web:a69255cc5b2b215d818448",
    measurementId: "G-JFZT6EQ05Z"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export { db, storage, auth };