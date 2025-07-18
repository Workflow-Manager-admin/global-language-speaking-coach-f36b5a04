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
      <NavLink to="/skilltree" className={({isActive}) => isActive ? "active" : ""}>🌳 Skill Tree</NavLink>
      <NavLink to="/challenge/1" className={({isActive}) => isActive ? "active" : ""}>🔊 Speaking Challenge</NavLink>
      <NavLink to="/progress" className={({isActive}) => isActive ? "active" : ""}>📊 Progress</NavLink>
      <NavLink to="/how-do-you-say" className={({isActive}) => isActive ? "active" : ""}>💬 How do you say</NavLink>
    </nav>
  );
}
export default SideNav;
