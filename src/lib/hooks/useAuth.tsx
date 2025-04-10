// /lib/hooks/useAuth.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthContextType {
  user: User | null;
  userData: any;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  error: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        setLoading(true);
        
        if (user) {
          setUser(user);
          
          // Get additional user data from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              setUserData(userDoc.data());
            }
          } catch (err: any) {
            setError(err.message);
          }
        } else {
          setUser(null);
          setUserData(null);
        }
        
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);