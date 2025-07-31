import React from "react";
import "../App.css";

// PUBLIC_INTERFACE
/**
 * Header is now simplified as authentication is not required.
 */
function Header() {
  return (
    <header className="header">
      <div className="header-title">
        <h1>🌍 Practice App</h1>
      </div>
      <div className="header-profile">
        {/* No auth profile or logout - Not required anymore */}
        <span className="header-notify" title="Notifications">🔔</span>
      </div>
    </header>
  );
}
export default Header;
