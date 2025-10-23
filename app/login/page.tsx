"use client";
import { useState } from "react";
import { userApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await userApi.post("/auth/login", { email, password });
      login(res.data.token, { userId: res.data.userId, role: "mentee", email });
      router.push("/mentors"); // redirect after login
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full border p-2"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
          Login
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}
