import React from "react";
import { useAuth } from "../context/AuthContext";
import "../App.css";

// PUBLIC_INTERFACE
function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="header">
      <div className="header-title">
        <h1>🌍 Practice App</h1>
      </div>
      <div className="header-profile">
        {user ? (
          <>
            <span className="profile-icon">{user.username[0].toUpperCase()}</span>
            <span className="profile-name">{user.username}</span>
            <button className="btn btn-link header-logout" onClick={logout}>Logout</button>
          </>
        ) : null}
        {/* Notifications placeholder */}
        <span className="header-notify" title="Notifications">🔔</span>
      </div>
    </header>
  );
}
export default Header;
