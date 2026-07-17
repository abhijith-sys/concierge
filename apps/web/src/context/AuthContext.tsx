import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.me,
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 1,
  });

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (user) => queryClient.setQueryData(["auth", "me"], user),
  });
  const registerMutation = useMutation({
    mutationFn: api.register,
    onSuccess: (user) => queryClient.setQueryData(["auth", "me"], user),
  });
  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => queryClient.setQueryData(["auth", "me"], null),
  });

  return (
    <AuthContext.Provider
      value={{
        user: me.data ?? null,
        isLoading: me.isLoading,
        login: loginMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
