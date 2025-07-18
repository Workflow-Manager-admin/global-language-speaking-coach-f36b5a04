import React, { useState, useEffect, createContext } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import "./index.css";

import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import LanguageSelector from "./components/LanguageSelector";
import LessonPage from "./components/LessonPage";
import ConversationPage from "./components/ConversationPage";
import ChallengePage from "./components/ChallengePage";
import ProgressPage from "./components/ProgressPage";
import Header from "./components/Header";
import SideNav from "./components/SideNav";
import SkillTree from "./components/SkillTree";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProgressProvider } from "./context/ProgressContext";
import { GamificationProvider } from "./context/GamificationContext";

// Theme colors from requirements
const THEME_COLORS = {
  '--accent-color': '#34c759',
  '--primary-color': '#0052cc',
  '--secondary-color': '#0c4c73',
};
Object.entries(THEME_COLORS).forEach(([key, value]) => {
  document.documentElement.style.setProperty(key, value);
});

// PUBLIC_INTERFACE
function App() {
  // Theme switching hook (light only per requirements, but structure allows extension)
  const [theme] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <AuthProvider>
      <GamificationProvider>
        <ProgressProvider>
          <Router>
            <div className="app-root">
              <Header />
              <div className="main-layout">
                <SideNav />
                <main className="main-content">
                  <Routes>
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                    <Route path="/language" element={<RequireAuth><LanguageSelector /></RequireAuth>} />
                    <Route path="/skilltree" element={<RequireAuth><SkillTree /></RequireAuth>} />
                    <Route path="/lesson/:levelId" element={<RequireAuth><LessonPage /></RequireAuth>} />
                    <Route path="/conversation/:levelId" element={<RequireAuth><ConversationPage /></RequireAuth>} />
                    <Route path="/challenge/:levelId" element={<RequireAuth><ChallengePage /></RequireAuth>} />
                    <Route path="/progress" element={<RequireAuth><ProgressPage /></RequireAuth>} />
                    <Route path="*" element={<Navigate replace to="/dashboard" />} />
                  </Routes>
                </main>
              </div>
            </div>
          </Router>
        </ProgressProvider>
      </GamificationProvider>
    </AuthProvider>
  );
}

// PUBLIC_INTERFACE
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default App;
