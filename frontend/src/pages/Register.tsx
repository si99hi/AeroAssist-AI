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
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-[#EFEFEF] px-4 py-3 text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#B22222] transition-colors font-sans"
              required
            />
          </div>
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
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-[#B22222] text-xs font-medium pl-1">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#111111] hover:bg-[#B22222] text-white py-3.5 font-semibold text-xs tracking-wider uppercase transition-colors"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-xs text-[#666666] mt-10 tracking-wide">
          Already have an account?{" "}
          <Link to="/login" className="text-[#B22222] hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
