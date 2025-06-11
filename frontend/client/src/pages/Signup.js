import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      await authApi.post("/register", { email, password });
      navigate("/login");
    } catch (err) {
      console.error(err);
      setErr("Signup failed. Try again.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Signup</h2>
      {err && <p style={{ color: "red" }}>{err}</p>}
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit">Signup</button>
      </form>
    </div>
  );
}

export default Signup;
