"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, LogIn, Server, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@itcare.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }

      // บันทึก Session ลงใน localStorage
      localStorage.setItem("it_care_user", JSON.stringify(data.user));
      localStorage.setItem("it_care_token", data.token);

      // เปลี่ยนหน้าไปที่หน้า Dashboard หลัก
      router.push("/");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-3">
            <Server className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            IT CARE System
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            ระบบติดตามสถานะและแจ้งเตือนการบำรุงรักษาเชิงป้องกัน (Email Login)
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">อีเมลผู้ใช้งาน (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="email" 
                required
                placeholder="admin@itcare.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">รหัสผ่าน (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (Login)"}
          </button>
        </form>

        {/* Demo Hint */}
        <div className="mt-8 p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> บัญชีทดสอบระบบ (Demo Account)
          </div>
          <p>Email: <code className="text-slate-200 font-mono">admin@itcare.com</code></p>
          <p>Password: <code className="text-slate-200 font-mono">admin123</code></p>
        </div>
      </div>
    </div>
  );
}
