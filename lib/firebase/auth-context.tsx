'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import Cookies from 'js-cookie';
import { auth, googleProvider, isFirebaseConfigured } from './client';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isDemo?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isFirebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInAsDemoUser: (name?: string, email?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'regtest_demo_user';
const AUTH_COOKIE_NAME = 'regtest_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync user state to cookie and localStorage
  const updateSession = (userData: AppUser | null, token?: string) => {
    setUser(userData);
    if (userData) {
      const sessionData = JSON.stringify({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
      });
      Cookies.set(AUTH_COOKIE_NAME, token || sessionData, { expires: 7, path: '/' });
      if (userData.isDemo) {
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(userData));
      }
    } else {
      Cookies.remove(AUTH_COOKIE_NAME, { path: '/' });
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    }
  };

  useEffect(() => {
    // Check if demo user exists in localStorage
    const savedDemoUser = typeof window !== 'undefined' ? localStorage.getItem(DEMO_USER_STORAGE_KEY) : null;
    if (savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        updateSession(parsed);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          const appUser: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            photoURL: firebaseUser.photoURL,
          };
          updateSession(appUser, token);
        } else {
          // If no active demo user either, clear
          if (!localStorage.getItem(DEMO_USER_STORAGE_KEY)) {
            updateSession(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Default to demo session if neither firebase nor saved user exists
      const fallbackUser: AppUser = {
        uid: 'demo-user-1',
        email: 'qa.lead@regressionhub.io',
        displayName: 'Alex Rivers (QA Lead)',
        isDemo: true,
      };
      updateSession(fallbackUser);
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      // Fallback demo login
      signInAsDemoUser('Google Tester', 'tester@google.com');
      return;
    }
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    const appUser: AppUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    };
    updateSession(appUser, token);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || !auth) {
      signInAsDemoUser(email.split('@')[0], email);
      return;
    }
    const result = await signInWithEmailAndPassword(auth, email, pass);
    const token = await result.user.getIdToken();
    const appUser: AppUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName || email.split('@')[0],
    };
    updateSession(appUser, token);
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || !auth) {
      signInAsDemoUser(email.split('@')[0], email);
      return;
    }
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const token = await result.user.getIdToken();
    const appUser: AppUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName || email.split('@')[0],
    };
    updateSession(appUser, token);
  };

  const signInAsDemoUser = (name = 'Alex Rivers (QA Lead)', email = 'qa.lead@regressionhub.io') => {
    const demoUser: AppUser = {
      uid: 'demo-' + Math.random().toString(36).substring(2, 9),
      email,
      displayName: name,
      isDemo: true,
    };
    updateSession(demoUser);
  };

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    updateSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseReady: isFirebaseConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsDemoUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
