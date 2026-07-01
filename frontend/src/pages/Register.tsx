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
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-sm border border-[#F1F1F1] rounded-3xl p-8 bg-[#FAFAFA] shadow-soft">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#111111] mb-2">Create Account</h1>
          <p className="text-[#666666] text-sm">Join the AeroAssist platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-[#F1F1F1] rounded-2xl px-4 py-3.5 text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all"
              required
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#F1F1F1] rounded-2xl px-4 py-3.5 text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-[#F1F1F1] rounded-2xl px-4 py-3.5 text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all"
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-[#E53935] text-xs font-medium pl-1">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#E53935] hover:bg-[#D32F2F] text-white py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-sm"
          >
            Register
          </button>
        </form>

        <p className="text-center text-sm text-[#666666] mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-[#E53935] hover:text-[#D32F2F] font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
