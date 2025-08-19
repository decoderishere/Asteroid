// src/components/LoginButton.tsx
"use client";
import { useAuth } from "../auth/AuthProvider";

export default function LoginButton() {
  const { user, loading, signIn } = useAuth();
  if (loading || user) return null;
  return (
    <button onClick={signIn} className="btn">
      Sign in with Microsoft
    </button>
  );
}
