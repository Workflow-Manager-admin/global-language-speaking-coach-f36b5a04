import React from "react";
import "../App.css";

// PUBLIC_INTERFACE
function Header() {
  // No user info or logout (authentication removed)
  return (
    <header className="header">
      <div className="header-title">
        <h1>🌍 Practice App</h1>
      </div>
      <div className="header-profile">
        <span className="header-notify" title="Notifications">🔔</span>
      </div>
    </header>
  );
}
export default Header;
