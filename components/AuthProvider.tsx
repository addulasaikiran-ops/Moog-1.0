"use client";
import { browserLocalPersistence, createUserWithEmailAndPassword, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
type AuthContextValue = { user: User | null; ready: boolean; configError: string; signIn: (email: string, password: string) => Promise<void>; signUp: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; getIdToken: () => Promise<string> };
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,setUser]=useState<User|null>(null); const [ready,setReady]=useState(false); const [configError,setConfigError]=useState("");
  useEffect(()=>{let unsubscribe=()=>{}; try{const auth=getFirebaseAuth(); void setPersistence(auth,browserLocalPersistence).finally(()=>{unsubscribe=onAuthStateChanged(auth,next=>{setUser(next);setReady(true);});});}catch(err){setConfigError(err instanceof Error?err.message:"Firebase Authentication is not configured.");setReady(true);} return ()=>unsubscribe();},[]);
  const value=useMemo<AuthContextValue>(()=>({user,ready,configError,signIn:async(email,password)=>{const auth=getFirebaseAuth();await signInWithEmailAndPassword(auth,email,password);},signUp:async(email,password)=>{const auth=getFirebaseAuth();await createUserWithEmailAndPassword(auth,email,password);},logout:async()=>{const auth=getFirebaseAuth();await signOut(auth);},getIdToken:async()=>{const auth=getFirebaseAuth();if(!auth.currentUser)throw new Error("Please sign in first.");return auth.currentUser.getIdToken();}}),[configError,ready,user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const context=useContext(AuthContext);if(!context)throw new Error("useAuth must be used inside AuthProvider");return context;}