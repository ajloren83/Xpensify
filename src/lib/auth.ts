// /lib/auth.ts
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    signOut,
    User,
  } from 'firebase/auth';
  import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
  import { auth, db } from './firebase';
  import { useSettings } from './settings-context';
  
  // Create a new user with email and password
  export const registerWithEmail = async (
    email: string, 
    password: string, 
    fullName: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with full name
      await updateProfile(user, { displayName: fullName });
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Get default settings from context
      const { settings } = useSettings();
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: fullName,
        createdAt: new Date().toISOString(),
        profileImageUrl: '',
        display: {
          currency: settings.display.currency,
          darkMode: settings.display.darkMode,
          language: settings.display.language,
        },
        salarySettings: {
          amount: 0,
          creditDateType: 'middle',
          customDate: 15,
          currency: settings.display.currency,
        },
        notifications: {
          salary: settings.notifications.salary,
          expenses: settings.notifications.expenses,
          recurring: settings.notifications.recurring,
        }
      });
      
      return user;
    } catch (error) {
      throw error;
    }
  };
  
  // Sign in with email and password
  export const loginWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };
  
  // Sign in with Google
  export const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Check if user document exists, if not create one
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Get default settings from context
        const { settings } = useSettings();
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName,
          createdAt: new Date().toISOString(),
          profileImageUrl: user.photoURL || '',
          display: {
            currency: settings.display.currency,
            darkMode: settings.display.darkMode,
            language: settings.display.language,
          },
          salarySettings: {
            amount: 0,
            creditDateType: 'middle',
            customDate: 15,
            currency: settings.display.currency,
          },
          notifications: {
            salary: settings.notifications.salary,
            expenses: settings.notifications.expenses,
            recurring: settings.notifications.recurring,
          }
        });
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  };
  
  // Send password reset email
  export const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Resend verification email
  export const resendVerificationEmail = async (user: User) => {
    try {
      await sendEmailVerification(user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Sign out
  export const logoutUser = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Update user profile
  export const updateUserProfile = async (user: User, data: any) => {
    try {
      // Update profile in Firebase Authentication
      if (data.fullName) {
        await updateProfile(user, { displayName: data.fullName });
      }
      
      // Update profile in Firestore
      await updateDoc(doc(db, 'users', user.uid), data);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Upload base64 profile image
  export const uploadProfileImage = async (user: User, base64Image: string) => {
    try {
      // Update profile in Firebase Authentication
      await updateProfile(user, { photoURL: base64Image });
      
      // Update profile in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        profileImageUrl: base64Image,
      });
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };