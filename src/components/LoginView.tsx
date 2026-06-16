/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserSession } from "../types";
import { Lock, Mail, User, ShieldCheck, AlertCircle, X, Key, CheckCircle } from "lucide-react";
const logoUrl = "/logo_sahamindo.jpg";

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showGooglePopup, setShowGooglePopup] = useState(false);

  // States for Custom Google Login
  const [isAddingCustomGoogle, setIsAddingCustomGoogle] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [customGoogleError, setCustomGoogleError] = useState("");

  // States for Forgot Password (Lupa Kata Sandi) Flow
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [demoVerificationCode, setDemoVerificationCode] = useState("558291");

  const handleSendForgotPasswordCode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotEmail) {
      setForgotError("Alamat email terdaftar wajib diisi.");
      return;
    }

    if (!forgotEmail.includes("@")) {
      setForgotError("Format email tidak valid.");
      return;
    }

    // Generate a fresh 6-digit verification code
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoVerificationCode(generated);

    setForgotSuccess(`Kode verifikasi 6 digit telah dikirim ke ${forgotEmail}!`);
    setTimeout(() => {
      setForgotStep(2);
      setForgotSuccess("");
    }, 1200);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotCode) {
      setForgotError("Kode verifikasi wajib diisi.");
      return;
    }

    if (forgotCode !== demoVerificationCode) {
      setForgotError("Kode verifikasi tidak cocok. Cobalah sandi demo pendukung.");
      return;
    }

    if (!forgotNewPassword || !forgotConfirmPassword) {
      setForgotError("Kata sandi baru dan konfirmasi wajib diisi.");
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotError("Kata sandi minimal harus terdiri dari 6 karakter.");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
      return;
    }

    setForgotSuccess("Kata sandi berhasil diperbarui!");
    
    // Auto populate credentials to log in instantly
    setEmail(forgotEmail);
    setPassword(forgotNewPassword);
    
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSuccess("");
      setForgotStep(1);
      setForgotEmail("");
      setForgotCode("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
      setSuccess("Kata sandi diperbarui! Anda dapat masuk sekarang dengan sandi baru.");
    }, 1800);
  };

  const handleAutofillDemo = () => {
    setEmail("analis@idx.id");
    setPassword("SahamJuara2026");
    setUsername("Analis Senior IDX");
    setIsLogin(true);
    setError("");
  };

  const handleGoogleAccountSelect = (selectedEmail: string, selectedName: string) => {
    setShowGooglePopup(false);
    setSuccess(`Masuk berhasil menggunakan google account ${selectedEmail}...`);
    setTimeout(() => {
      onLoginSuccess({
        email: selectedEmail,
        name: selectedName,
        isLoggedIn: true
      });
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    if (!isLogin && !username) {
      setError("Nama lengkap harus diisi untuk proses registrasi.");
      return;
    }

    if (isLogin) {
      // Demo credentials check
      if (email === "analis@idx.id" && password === "SahamJuara2026") {
        onLoginSuccess({
          email: "analis@idx.id",
          name: "Analis Senior IDX",
          isLoggedIn: true
        });
      } else {
        // Allow any standard login for friction-free simulation
        onLoginSuccess({
          email: email,
          name: email.split("@")[0].toUpperCase(),
          isLoggedIn: true
        });
      }
    } else {
      // Sign up simulation
      setSuccess("Pendaftaran berhasil! Mengalihkan ke halaman masuk...");
      setTimeout(() => {
        setIsLogin(true);
        setSuccess("");
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-slate-100">
      {/* Decorative Orbs in Background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-600/15 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Header Brand */}
      <div className="mb-8 flex items-center space-x-3.5 z-10">
        <img
          src={logoUrl}
          alt="SahamIndo Logo"
          referrerPolicy="no-referrer"
          className="w-16 h-16 object-cover rounded-xl shadow-lg border border-slate-800 ring-2 ring-white/10"
        />
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            IDX SAHAM REALTIME
          </h1>
          <p className="text-xs text-slate-400 tracking-wider">INDONESIAN EQUITY ANALYTICAL PORTAL</p>
        </div>
      </div>

      {/* Main Glassmorphic Form Card */}
      <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl relative z-10 border border-slate-800">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white tracking-tight leading-relaxed">
            {isLogin ? "Selamat Datang di Portal Saham Indo" : "Daftar Akun"}
          </h2>
          {!isLogin && (
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Akses screener kelas institusi dan Market Tracer berbasis AI
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-lg flex items-start space-x-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-start space-x-2.5 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Budi Santoso"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                placeholder="trader@idx.id"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {isLogin && (
            <div className="text-right">
              <button 
                type="button" 
                className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-all font-medium"
                onClick={() => {
                  setForgotError("");
                  setForgotSuccess("");
                  setForgotEmail(email); // Prefill if user typed their email on the login screen
                  setShowForgotModal(true);
                  setForgotStep(1);
                }}
              >
                Lupa Kata Sandi?
              </button>
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            className="w-full h-11 mt-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/10 active:scale-[0.99] transition-all cursor-pointer"
          >
            {isLogin ? "Masuk" : "Buat Akun Keanggotaan"}
          </button>
        </form>

        {/* Autofill Demo Section / Masuk Google */}
        {isLogin && (
          <div className="mt-5 pt-5 border-t border-slate-800 text-center">
            <button
              id="autofill-demo-btn"
              type="button"
              onClick={() => {
                setIsAddingCustomGoogle(false);
                setCustomGoogleName("");
                setCustomGoogleEmail("");
                setCustomGoogleError("");
                setShowGooglePopup(true);
              }}
              className="w-full h-11 border border-slate-800 bg-slate-900/60 rounded-lg hover:border-slate-700 hover:bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center space-x-2.5 px-4 active:scale-[0.98] transition-all cursor-pointer"
            >
              <svg className="w-4.5 h-4.5 text-[#ea4335] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Masuk dengan Google</span>
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {isLogin ? (
            <span>
              Belum memiliki akun?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                  setSuccess("");
                }}
                className="text-blue-400 font-semibold hover:underline"
              >
                Daftar Baru
              </button>
            </span>
          ) : (
            <span>
              Sudah mempunyai akun?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                  setSuccess("");
                }}
                className="text-blue-400 font-semibold hover:underline"
              >
                Log In disini
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Authentic Google Account Selector Modal Popup */}
      {showGooglePopup && (
        <div className="fixed inset-0 bg-black/75 z-40 flex items-center justify-center p-4 backdrop-blur-xs select-none animate-fadeIn">
          <div className="bg-[#101926] border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
            {/* Google Logo SVG */}
            <div className="flex flex-col items-center text-center mt-2.5">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              
              {!isAddingCustomGoogle ? (
                <>
                  <h3 className="text-base font-bold text-white mt-4 font-sans text-slate-100">Pilih akun</h3>
                  <p className="text-xs text-slate-400 mt-1">untuk melanjutkan ke SahamIndo</p>
                </>
              ) : (
                <>
                  <h3 className="text-base font-bold text-white mt-4 font-sans text-slate-100">Gunakan Akun Google Lain</h3>
                  <p className="text-xs text-slate-400 mt-1">Masukkan data akun untuk langsung disimulasikan</p>
                </>
              )}
            </div>

            {/* List of accounts / Custom Input options Form */}
            {isAddingCustomGoogle ? (
              <div className="mt-5 space-y-4">
                {customGoogleError && (
                  <div className="p-3 bg-rose-955/40 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{customGoogleError}</span>
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="E.g. Budi Hartono"
                      value={customGoogleName}
                      onChange={(e) => {
                        setCustomGoogleName(e.target.value);
                        setCustomGoogleError("");
                      }}
                      className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Alamat Email (Gmail)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      placeholder="E.g. budihartono@gmail.com"
                      value={customGoogleEmail}
                      onChange={(e) => {
                        setCustomGoogleEmail(e.target.value);
                        setCustomGoogleError("");
                      }}
                      className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomGoogle(false);
                      setCustomGoogleError("");
                    }}
                    className="w-1/2 h-11 border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 rounded-lg text-xs font-semibold text-slate-350 transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!customGoogleEmail.trim() || !customGoogleName.trim()) {
                        setCustomGoogleError("Nama Lengkap dan Alamat Email wajib diisi.");
                        return;
                      }
                      if (!customGoogleEmail.includes("@")) {
                        setCustomGoogleError("Format email tidak valid.");
                        return;
                      }
                      handleGoogleAccountSelect(customGoogleEmail.trim(), customGoogleName.trim());
                    }}
                    className="w-1/2 h-11 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Lanjutkan
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-2 max-h-64 overflow-y-auto">
                {/* Option 1: Pendaftar Email (ereenazxc8@gmail.com) */}
                <div 
                  onClick={() => handleGoogleAccountSelect("ereenazxc8@gmail.com", "Ereen")}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-600/90 text-white flex items-center justify-center font-black uppercase text-sm font-sans">
                      E
                    </div>
                    <div className="text-left leading-normal">
                      <p className="text-xs font-bold text-slate-100 font-sans leading-none">Ereen</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-none">ereenazxc8@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-[8.5px] font-mono text-emerald-450 uppercase font-black bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded">Pendaftar</span>
                </div>

                {/* Option 2: Analis Senior (analis@idx.id) */}
                <div 
                  onClick={() => handleGoogleAccountSelect("analis@idx.id", "Analis Senior IDX")}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-full bg-blue-600/90 text-white flex items-center justify-center font-black uppercase text-sm font-sans">
                      A
                    </div>
                    <div className="text-left leading-normal">
                      <p className="text-xs font-bold text-slate-100 font-sans leading-none">Analis Senior IDX</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-none">analis@idx.id</p>
                    </div>
                  </div>
                  <span className="text-[8.5px] font-mono text-blue-450 uppercase font-black bg-blue-950/40 border border-blue-900/30 px-2 py-0.5 rounded">Penguji</span>
                </div>

                {/* Option 3: Gunakan Akun Lain (Now perfectly clickable & opens form fields) */}
                <div 
                  onClick={() => {
                    setIsAddingCustomGoogle(true);
                    setCustomGoogleEmail("");
                    setCustomGoogleName("");
                    setCustomGoogleError("");
                  }}
                  className="flex items-center space-x-3.5 p-3.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer text-slate-400 hover:text-slate-100 active:scale-[0.98]"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-850 flex items-center justify-center text-slate-400 border border-slate-800">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-blue-400 font-sans">Gunakan akun Google yang lain</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel btn */}
            {!isAddingCustomGoogle && (
              <div className="mt-6 flex justify-end gap-2 border-t border-slate-900 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGooglePopup(false)}
                  className="px-4 py-2 hover:bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔐 Interactive Forgot Password (Lupa Kata Sandi) Modal popup block */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none animate-fadeIn">
          <div className="bg-[#101926] border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
            {/* Modal close icon button */}
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-slate-450 hover:text-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon */}
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-3">
                <Key className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Atur Ulang Kata Sandi</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed px-2">
                {forgotStep === 1 
                  ? "Pulihkan akses masuk portal IDX Saham dengan email Anda"
                  : `Verifikasi perubahan sandi terdaftar untuk email ${forgotEmail}`
                }
              </p>
            </div>

            {/* Content Notifications */}
            {forgotError && (
              <div className="mt-4 p-3 bg-rose-955/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mt-4 p-3 bg-emerald-955/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* Step form elements */}
            {forgotStep === 1 ? (
              <form onSubmit={handleSendForgotPasswordCode} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email Terdaftar</label>
                  <div className="relative">
                    <Mail className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="Masukkan email Anda (e.g. trader@idx.id)"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        setForgotError("");
                      }}
                      className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-655 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-1/2 h-11 border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 rounded-lg text-xs font-semibold text-slate-350 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 h-11 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-500 rounded-lg text-xs font-semibold text-white shadow-md active:scale-[0.98] transition-colors cursor-pointer"
                  >
                    Kirim Kode Verifikasi
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="mt-5 space-y-4">
                
                {/* ℹ️ Assistance interactive notification panel */}
                <div className="p-3.5 bg-blue-950/20 border border-blue-900/30 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-blue-305">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping"></span>
                    KODE VERIFIKASI IDX SAHAMINDO
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Sistem otomatis mengirimkan kode verifikasi 6-digit ke email pendaftaran Anda. Gunakan kode demo aktif: {" "}
                    <strong className="text-emerald-450 font-mono tracking-widest text-[11.5px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/20">{demoVerificationCode}</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-404 mb-1 uppercase tracking-wider">Kode Verifikasi (6-Digit)</label>
                  <div className="relative">
                    <Key className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder={`Contoh: ${demoVerificationCode}`}
                      maxLength={6}
                      value={forgotCode}
                      onChange={(e) => {
                        setForgotCode(e.target.value);
                        setForgotError("");
                      }}
                      className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-900 border border-slate-805 text-sm font-mono text-emerald-400 tracking-wider placeholder-slate-655 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-404 mb-1 uppercase tracking-wider">Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="Kata sandi baru (min 6 karakter)"
                      value={forgotNewPassword}
                      onChange={(e) => {
                        setForgotNewPassword(e.target.value);
                        setForgotError("");
                      }}
                      className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-900 border border-slate-805 text-sm text-slate-100 placeholder-slate-655 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-404 mb-1 uppercase tracking-wider">Konfirmasi Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="Ulangi kata sandi baru"
                      value={forgotConfirmPassword}
                      onChange={(e) => {
                        setForgotConfirmPassword(e.target.value);
                        setForgotError("");
                      }}
                      className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-900 border border-slate-805 text-sm text-slate-100 placeholder-slate-655 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError("");
                    }}
                    className="w-1/3 h-11 border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 rounded-lg text-xs font-semibold text-slate-350 transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 h-11 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 rounded-lg text-xs font-semibold text-white shadow-md active:scale-[0.98] transition-colors cursor-pointer"
                  >
                    Perbarui Kata Sandi
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Bottom Legal Notice */}
      <div className="mt-8 text-center text-[10px] text-slate-600 max-w-xs leading-relaxed z-10">
        Investasi saham mengandung risiko pasar. Seluruh data keuangan harian yang disajikan di portal ini hanyalah tujuan edukasi dan referensi.
      </div>
    </div>
  );
}
