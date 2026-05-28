import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import academyLogo from "../assets/logo ac.jpg";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "alrazians" && password === "AlRazi@99") {
      setLoginError("");
      navigate("/admin-panel"); // Moves to the admin workspace
    } else {
      setLoginError("Invalid username or password credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans antialiased flex flex-col items-center justify-center p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-100">
        <div className="bg-[#1e3a8a] text-white py-10 px-6 text-center flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-5%] w-24 h-24 bg-white/5 rounded-full pointer-events-none" />

          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-1 shadow-md mb-4 z-10">
            <img src={academyLogo} alt="Al Razi Academy Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <h2 className="text-lg font-bold uppercase tracking-wider z-10">Al Razi Academy</h2>
          <p className="text-xs italic text-slate-300/90 font-light mt-1 z-10">Excellence lies in determination</p>
        </div>

        <div className="p-6 md:p-8 space-y-5">
          <div className="flex items-center space-x-2 text-slate-500 font-semibold tracking-wider text-xs uppercase mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </div>

          {loginError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 font-medium">
              {loginError}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold tracking-wide text-slate-500 uppercase">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              className="w-full bg-slate-100 text-slate-700 font-medium py-2.5 px-4 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white focus:ring-0 transition-all outline-none text-sm placeholder-slate-400"
                />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold tracking-wide text-slate-500 uppercase">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full bg-slate-100 text-slate-700 font-medium py-2.5 px-4 pr-11 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white focus:ring-0 transition-all outline-none text-sm placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 outline-none p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-[#1e3a8a] hover:bg-[#1a337a] text-white py-3 rounded-xl font-bold tracking-wide text-sm transition-all duration-200 mt-2 shadow-sm active:scale-[0.99]">
            <span>LOGIN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      <button
        onClick={() => navigate("/")}
        className="mt-6 text-xs text-slate-500 hover:text-slate-800 font-medium transition-all flex items-center space-x-1 outline-none"
      >
        <span>← Back to Teacher Dashboard</span>
      </button>
    </div>
  );
}