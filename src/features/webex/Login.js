import React, { useState } from "react";

export const Login = () => {
  const [token, setToken] = useState("");
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column"
      }}
    >
      <input
        value={token}
        onChange={e => setToken(e.target.value)}
        style={{ margin: 5, padding: 10, width: "80%", maxWidth: 600 }}
      />
      <button
        style={{
          margin: 5,
          padding: 10,
          width: "80%",
          maxWidth: 600,
          cursor: "pointer"
        }}
      >
        Submit Token
      </button>
    </div>
  );
};
