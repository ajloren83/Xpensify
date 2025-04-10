"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log("AuthProvider: Setting up auth state listener");
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("AuthProvider: Auth state changed", user ? "User logged in" : "No user");
      setUser(user);
      
      // Set or remove auth cookie based on user state
      if (user) {
        // Set auth cookie with user ID
        Cookies.set('auth', user.uid, { expires: 7 }); // Cookie expires in 7 days
      } else {
        // Remove auth cookie when user logs out
        Cookies.remove('auth');
      }
      
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      console.log("AuthProvider: Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Cookie will be set by the onAuthStateChanged listener
    } catch (error: any) {
      // Map Firebase error codes to user-friendly messages
      const errorMessage = (() => {
        switch (error.code) {
          case 'auth/invalid-email':
            return 'Invalid email address';
          case 'auth/user-disabled':
            return 'This account has been disabled';
          case 'auth/user-not-found':
            return 'No account found with this email';
          case 'auth/wrong-password':
            return 'Incorrect password';
          case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later';
          default:
            return 'Failed to sign in. Please try again';
        }
      })();
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    // Cookie will be set by the onAuthStateChanged listener
  };

  const logout = async () => {
    await signOut(auth);
    // Cookie will be removed by the onAuthStateChanged listener
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const verifyEmail = async () => {
    if (user) {
      await sendEmailVerification(user);
    }
  };

  const signInWithGoogle = async () => {
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
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
    verifyEmail,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {initialized && children}
    </AuthContext.Provider>
  );
} 