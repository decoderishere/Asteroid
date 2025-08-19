// src/components/LogoutButton.tsx
"use client";
import { useAuth } from "../auth/AuthProvider";

export default function LogoutButton() {
  const { user, signOut, loading } = useAuth();
  if (loading || !user) return null;
  return (
    <button onClick={signOut} className="btn">
      Logout
    </button>
  );
}
