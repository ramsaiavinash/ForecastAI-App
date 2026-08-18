import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type UserRole = "Finance" | "Forecaster" | "PL" | "PH";

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem("forecastai-role");
    if (savedRole === "Finance" || savedRole === "Forecaster" || savedRole === "PL" || savedRole === "PH") {
      return savedRole;
    }
    return "Forecaster";
  });

  useEffect(() => {
    localStorage.setItem("forecastai-role", role);
  }, [role]);

  const value = useMemo(
    () => ({
      role,
      setRole: setRoleState,
    }),
    [role]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }

  return context;
}
