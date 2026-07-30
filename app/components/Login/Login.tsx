'use client'

import { useState } from "react";
// import { useNavigate } from "react-router-dom";
import "./login.css";
import { useRouter } from "next/navigation";


export default function LoginPage() {
  // const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
      const router = useRouter()

  const handleSubmit = async (e: { preventDefault: () => void; target: HTMLFormElement | undefined; }) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.target);
    const username = formData.get("email"); // name="email" digunakan sebagai username
    const password = formData.get("password");

    if (!username || !password) {
      setError("Harap isi semua kolom.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login gagal, periksa kembali kredensial Anda.");
      }

      // Simpan token atau data user (opsional, contoh di localStorage)
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Arahkan ke halaman utama setelah login sukses
      router.push("/editor")

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err : any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-viewport">
      <div className="login-card glass-container">
        <div className="login-header">
          <h1 className="login-title">Masuk Akun</h1>
          <p className="login-subtitle">Silakan masuk untuk mengakses layanan Anda</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {/* Pesan error */}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email / Username</label>
            <input
              type="text"
              id="email"
              name="email"
              placeholder="nama@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Kata Sandi</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <label className="remember-me">
              <input type="checkbox" name="remember" disabled={loading} />
              <span>Ingat saya</span>
            </label>
            <a href="#" className="forgot-link">Lupa kata sandi?</a>
          </div>

          <button
            type="submit"
            className="btn-primary btn-submit"
            disabled={loading}
          >
            {loading ? "Memuat..." : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  );
}