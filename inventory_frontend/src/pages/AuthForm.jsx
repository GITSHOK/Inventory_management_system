import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const API_BASE = "http://localhost:8080/user";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors =
    type === "error"
      ? "bg-red-600 text-white"
      : "bg-green-600 text-white";

  return (
    <div
      className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 ${colors} transition-all`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="text-white font-bold">
        ✕
      </button>
    </div>
  );
}

export default function AuthForm() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup fields
  const [username, setUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Toast state
  const [toast, setToast] = useState(null);

  function showToast(message, type = "error") {
    setToast({ message, type });
  }

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const token = await res.text();

      if (!res.ok || token === "Invalid Credentials") {
        showToast("Invalid email or password", "error");
        return;
      }

      localStorage.setItem("token", token);

      const decoded = jwtDecode(token);
      localStorage.setItem("username", decoded.username);
      localStorage.setItem("role", decoded.role);

      showToast("Login successful!", "success");
      navigate("/products");
    } catch (error) {
      showToast("Could not connect to server", "error");
    }
  }

  async function handleSignup(e) {
    e.preventDefault();

    if (signupPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      if (res.status === 409) {
        const errorMsg = await res.text();
        showToast(errorMsg, "error");
        return;
      }

      if (!res.ok) {
        showToast("Registration failed", "error");
        return;
      }

      showToast("Account created successfully!", "success");

      setUsername("");
      setSignupEmail("");
      setSignupPassword("");
      setConfirmPassword("");

      setIsLogin(true);
    } catch (error) {
      showToast("Could not connect to server", "error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-xl border border-zinc-800">
        <h1 className="text-2xl text-white font-bold mb-6">
          Inventory System
        </h1>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setToast(null);
            }}
            className={`flex-1 py-2 rounded ${
              isLogin
                ? "bg-indigo-600 text-white"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => {
              setIsLogin(false);
              setToast(null);
            }}
            className={`flex-1 py-2 rounded ${
              !isLogin
                ? "bg-indigo-600 text-white"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            Signup
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="p-3 rounded bg-zinc-950 border border-zinc-700 text-white"
            />

            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="p-3 rounded bg-zinc-950 border border-zinc-700 text-white"
            />

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded"
            >
              Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="p-3 rounded bg-zinc-950 border border-zinc-700 text-white"
            />

            <input
              type="email"
              placeholder="Email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              className="p-3 rounded bg-zinc-950 border border-zinc-700 text-white"
            />

            <input
              type="password"
              placeholder="Password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              className="p-3 rounded bg-zinc-950 border border-zinc-700 text-white"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="p-3 rounded bg-zinc-950 border border-zinc-700 text-white"
            />

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded"
            >
              Create Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}