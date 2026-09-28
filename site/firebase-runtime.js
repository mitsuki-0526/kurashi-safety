import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import {getAuth,setPersistence,browserSessionPersistence,GoogleAuthProvider,signInWithPopup,signInAnonymously,signOut} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import {getFirestore,doc,collection,getDoc,getDocs,setDoc,updateDoc,deleteDoc,query,where,onSnapshot,serverTimestamp,runTransaction} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';
export const dbSdk={doc,collection,getDoc,getDocs,setDoc,updateDoc,deleteDoc,query,where,onSnapshot,serverTimestamp,runTransaction};
export async function connect(kind){const name='safety-'+kind;const app=getApps().find(a=>a.name===name)||initializeApp(firebaseConfig,name);const auth=getAuth(app);await setPersistence(auth,browserSessionPersistence);await auth.authStateReady();return {auth,db:getFirestore(app)};}
export async function teacherLogin(auth){return (await signInWithPopup(auth,new GoogleAuthProvider())).user;}
export async function studentLogin(auth){return auth.currentUser?.isAnonymous?auth.currentUser:(await signInAnonymously(auth)).user;}
export {signOut};
