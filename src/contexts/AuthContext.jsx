import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Listen to user document for real-time role updates
        const userDocRef = doc(db, 'usuarios_aprovados', user.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user data:", error);
          setLoading(false);
        });
        
        return () => {
          unsubscribeDoc();
        };
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create the user document with pending status
    await setDoc(doc(db, 'usuarios_aprovados', user.uid), {
      nome: name,
      email: email,
      status: 'pendente', // can be 'pendente', 'aprovado'
      createdAt: new Date().getTime()
    });
    
    return userCredential;
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
