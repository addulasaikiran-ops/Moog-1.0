"use client";
import { browserLocalPersistence, createUserWithEmailAndPassword, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { firebaseAuth } from "@/lib/firebase";
type AuthContextValue = { user: User | null; ready: boolean; signIn: (email: string, password: string) => Promise<void>; signUp: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; getIdToken: () => Promise<string> };
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [ready, setReady] = useState(false);
  useEffect(() => { let unsubscribe = () => {}; void setPersistence(firebaseAuth, browserLocalPersistence).finally(() => { unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => { setUser(nextUser); setReady(true); }); }); return () => unsubscribe(); }, []);
  const value = useMemo<AuthContextValue>(() => ({ user, ready, signIn: async (email, password) => { await signInWithEmailAndPassword(firebaseAuth, email, password); }, signUp: async (email, password) => { await createUserWithEmailAndPassword(firebaseAuth, email, password); }, logout: async () => { await signOut(firebaseAuth); }, getIdToken: async () => { if (!firebaseAuth.currentUser) throw new Error("Please sign in first."); return firebaseAuth.currentUser.getIdToken(); } }), [ready, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used inside AuthProvider"); return context; }