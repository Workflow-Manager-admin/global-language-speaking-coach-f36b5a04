import React from "react";
import "../App.css";

// PUBLIC_INTERFACE
/**
 * Friend List UI - shows current user's friends (mock data only).
 */
function FriendsList({ friends }) {
  if (!friends || friends.length === 0) {
    return (
      <div className="friends-block" style={{
        padding: "18px 12px",
        background: "#fff",
        borderRadius: 9,
        marginTop: 18,
        minWidth: 170,
        boxShadow: "0 1px 7px 0 rgba(41,61,120,0.05)"
      }}>
        <h3 style={{margin:0, fontSize:"1.08em", color:"var(--primary-color)", fontWeight:600}}>Friends</h3>
        <div style={{marginTop:12, color:"#bbb"}}>No friends yet!</div>
      </div>
    );
  }

  return (
    <div className="friends-block" style={{
      padding: "18px 12px",
      background: "#fff",
      borderRadius: 9,
      marginTop: 18,
      minWidth: 170,
      boxShadow: "0 1px 7px 0 rgba(41,61,120,0.05)"
    }}>
      <h3 style={{margin:0, fontSize:"1.08em", color:"var(--primary-color)", fontWeight:600}}>Friends</h3>
      <ul style={{listStyle:"none", margin: 0, padding:0}}>
        {friends.map(friend => (
          <li key={friend.username} style={{
            margin: "10px 0",
            padding: "2px 0",
            fontWeight: 500,
            color: "var(--primary-color)"
          }}>
            <span style={{
              background: "#eaf9fa",
              borderRadius: "50%",
              display: "inline-block",
              width: 24,
              height: 24,
              textAlign: "center",
              marginRight: 10,
              fontSize: 17,
              color: "var(--accent-color)",
              fontWeight: 700,
            }}>{friend.username[0].toUpperCase()}</span>
            {friend.username}
            <span style={{float:"right", color:"#aaa", fontSize:"0.92em"}}>XP: {friend.xp}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FriendsList;
