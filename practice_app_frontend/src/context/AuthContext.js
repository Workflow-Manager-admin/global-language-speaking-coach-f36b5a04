import React, { createContext, useContext, useState } from "react";

// PUBLIC_INTERFACE
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem("user")) || null
  );

  // PUBLIC_INTERFACE
  function login(username, password) {
    // In real app: authenticate with backend
    // For demo, accept any username/password
    return new Promise((resolve, reject) => {
      if (username && password) {
        const userObj = { username };
        setUser(userObj);
        localStorage.setItem("user", JSON.stringify(userObj));
        resolve(userObj);
      } else {
        reject();
      }
    });
  }

  // PUBLIC_INTERFACE
  function logout() {
    setUser(null);
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useAuth() {
  return useContext(AuthContext);
}
