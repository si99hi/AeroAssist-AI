import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await authApi.register(name, email, password);
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch {
      setError("Registration failed — email may already exist");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-border rounded-2xl p-8 bg-panel">
        <h1 className="text-2xl font-semibold mb-1">Create account</h1>
        <p className="text-gray-400 text-sm mb-6">Join AeroAssist AI</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#0f1115] border border-border rounded-lg px-4 py-3 text-sm"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0f1115] border border-border rounded-lg px-4 py-3 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0f1115] border border-border rounded-lg px-4 py-3 text-sm"
            minLength={6}
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-accent py-3 rounded-lg font-medium">
            Register
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
