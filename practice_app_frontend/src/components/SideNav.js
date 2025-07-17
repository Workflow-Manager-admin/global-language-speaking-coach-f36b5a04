import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../App.css";

// PUBLIC_INTERFACE
function SideNav() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <nav className="sidenav">
      <NavLink to="/dashboard" className={({isActive}) => isActive ? "active" : ""}>🏠 Dashboard</NavLink>
      <NavLink to="/language" className={({isActive}) => isActive ? "active" : ""}>🌐 Select Language</NavLink>
      <NavLink to="/lesson/1" className={({isActive}) => isActive ? "active" : ""}>📖 Lessons</NavLink>
      <NavLink to="/challenge/1" className={({isActive}) => isActive ? "active" : ""}>🔊 Speaking Challenge</NavLink>
      <NavLink to="/progress" className={({isActive}) => isActive ? "active" : ""}>📊 Progress</NavLink>
    </nav>
  );
}
export default SideNav;
