"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import Cookies from 'js-cookie';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateProfile: (data: { 
    displayName: string; 
    photoURL: string | null | undefined;
  }) => Promise<{ success: boolean; error?: string }>;
  deleteProfileImage: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Setting up auth state listener");
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthProvider: Auth state changed", user ? "User logged in" : "No user");
      if (user) {
        // Get the latest user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Update the user object with Firestore data
          setUser({
            ...user,
            displayName: userData.displayName || user.displayName,
            photoURL: userData.photoURL || user.photoURL,
          });
        } else {
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      
      // Set or remove auth cookie based on user state
      if (user) {
        // Set auth cookie with user ID
        Cookies.set('auth', user.uid, { expires: 7 }); // Cookie expires in 7 days
      } else {
        // Remove auth cookie when user logs out
        Cookies.remove('auth');
      }
    });

    return () => {
      console.log("AuthProvider: Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    login: async (email: string, password: string) => {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        setUser(result.user);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    signup: async (email: string, password: string, displayName: string) => {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName });
        await setDoc(doc(db, 'users', result.user.uid), {
          displayName,
          email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setUser(result.user);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    logout: async () => {
      try {
        await signOut(auth);
        setUser(null);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    resetPassword: async (email: string) => {
      await sendPasswordResetEmail(auth, email);
    },
    verifyEmail: async () => {
      if (user) {
        await sendEmailVerification(user);
      }
    },
    signInWithGoogle: async () => {
      try {
        console.log("Attempting to sign in with Google");
        await signInWithPopup(auth, googleProvider);
        console.log("Google sign in successful");
        // Cookie will be set by the onAuthStateChanged listener
      } catch (error: any) {
        console.error("Google sign in error details:", {
          code: error.code,
          message: error.message,
          fullError: error
        });
        throw error;
      }
    },
    updateProfile: async (data: { 
      displayName: string; 
      photoURL: string | null | undefined;
    }) => {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      try {
        // Get the current user from auth
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user found');
        }

        // Update Firebase Auth profile
        await updateProfile(currentUser, {
          displayName: data.displayName,
        });

        // Update Firestore document
        await updateDoc(doc(db, 'users', currentUser.uid), {
          displayName: data.displayName,
          photoURL: data.photoURL,
          updatedAt: serverTimestamp(),
        });

        // Update local state
        setUser(prev => prev ? {
          ...prev,
          displayName: data.displayName,
          photoURL: data.photoURL || null,
        } : null);

        return { success: true };
      } catch (error: any) {
        console.error('Error updating profile:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to update profile' 
        };
      }
    },
    deleteProfileImage: async () => {
      if (!user) return { success: false, error: 'No user logged in' };
      
      try {
        // Get the current user from auth
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user found');
        }

        // Update Firestore user document to remove photoURL
        await updateDoc(doc(db, 'users', currentUser.uid), {
          photoURL: null,
          updatedAt: new Date().toISOString(),
        });

        // Update local user state
        setUser({
          ...currentUser,
          photoURL: null,
        });

        return { success: true };
      } catch (error: any) {
        console.error("Error deleting profile image:", error);
        return { success: false, error: error.message };
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 