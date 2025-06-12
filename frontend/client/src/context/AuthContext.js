import { createContext, useContext } from "react";

// Dummy fallback for now (replace with your real AuthContext)
const AuthContext = createContext({
  token: localStorage.getItem("token"), // or null
});

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
