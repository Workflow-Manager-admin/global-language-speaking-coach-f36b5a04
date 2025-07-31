import React from "react";
import { NavLink } from "react-router-dom";
import "../App.css";

// PUBLIC_INTERFACE
function SideNav() {
  // Unconditionally show navigation, authentication removed.
  return (
    <nav className="sidenav">
      <NavLink to="/dashboard" className={({isActive}) => isActive ? "active" : ""}>🏠 Dashboard</NavLink>
      <NavLink to="/language" className={({isActive}) => isActive ? "active" : ""}>🌐 Select Language</NavLink>
      <NavLink to="/skilltree" className={({isActive}) => isActive ? "active" : ""}>🌳 Skill Tree</NavLink>
      <NavLink to="/challenge/1" className={({isActive}) => isActive ? "active" : ""}>🔊 Speaking Challenge</NavLink>
      <NavLink to="/progress" className={({isActive}) => isActive ? "active" : ""}>📊 Progress</NavLink>
    </nav>
  );
}
export default SideNav;
