import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-sm border border-[#EFEFEF] p-10 bg-white">
        <div className="mb-10 text-center">
          <h1 className="serif-heading text-4xl font-normal tracking-tight text-[#111111] mb-3">
            AeroAssist
          </h1>
          <p className="text-[#666666] text-xs font-normal tracking-widest uppercase">
            Operations & Intelligence
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#EFEFEF] px-4 py-3 text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#B22222] transition-colors font-sans"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-[#EFEFEF] px-4 py-3 text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#B22222] transition-colors font-sans"
              required
            />
          </div>
          {error && <p className="text-[#B22222] text-xs font-medium pl-1">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#111111] hover:bg-[#B22222] text-white py-3.5 font-semibold text-xs tracking-wider uppercase transition-colors"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-xs text-[#666666] mt-10 tracking-wide">
          New to the platform?{" "}
          <Link to="/register" className="text-[#B22222] hover:underline font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
