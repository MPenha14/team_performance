import { ReactNode, useMemo, useState } from "react";
import { AuthContext } from "../hooks/useAuth";
import { loginRequest } from "../services/authService";
import { clearStoredToken, getStoredToken, setStoredToken } from "../utils/tokenStorage";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login: async (email: string, password: string) => {
        const newToken = await loginRequest(email, password);
        setStoredToken(newToken);
        setToken(newToken);
      },
      logout: () => {
        clearStoredToken();
        setToken(null);
      },
    }),
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
