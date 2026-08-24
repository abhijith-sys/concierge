import { createContext } from "react";
import type { User, UserRole } from "../lib/api";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (input: { email: string; password: string }) => Promise<User>;
  register: (input: {
    name: string;
    email: string;
    phone?: string;
    recoveryEmail?: string;
    password: string;
    role?: UserRole;
  }) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
