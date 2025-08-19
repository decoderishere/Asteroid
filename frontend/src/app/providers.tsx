"use client";
import { AuthProvider } from "../auth/AuthProvider";
export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
