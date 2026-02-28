import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthResponse } from "@/types/auth";

interface AuthContextType {
  token: string | null;
  profileId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<string>;
  register: (username: string, password: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );
  const [profileId, setProfileId] = useState<string | null>(
    () => localStorage.getItem("profileId")
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setProfileId(data.profile_id);
        localStorage.setItem("profileId", data.profile_id);
      })
      .catch(() => {
        setToken(null);
        setProfileId(null);
        localStorage.removeItem("token");
        localStorage.removeItem("profileId");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleAuth = async (
    endpoint: string,
    username: string,
    password: string
  ): Promise<string> => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    const data: AuthResponse = await res.json();
    setToken(data.access_token);
    setProfileId(data.profile_id);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("profileId", data.profile_id);
    return data.profile_id;
  };

  const login = (username: string, password: string) =>
    handleAuth("/api/auth/login", username, password);

  const register = (username: string, password: string) =>
    handleAuth("/api/auth/register", username, password);

  const logout = () => {
    setToken(null);
    setProfileId(null);
    localStorage.removeItem("token");
    localStorage.removeItem("profileId");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        profileId,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
