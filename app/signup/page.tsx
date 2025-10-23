"use client";
import { useState } from "react";
import { userApi } from "@/lib/api";

export default function Signup() {
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "mentee" });
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await userApi.post("/auth/signup", form);
      setMessage("Signup successful! Token: " + res.data.token);
    } catch (err: any) {
      setMessage("Error: " + err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Signup</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full border p-2" placeholder="Name"
          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="w-full border p-2" placeholder="Email"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="w-full border p-2" type="password" placeholder="Password"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <select className="w-full border p-2"
          value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          <option value="mentee">Mentee</option>
          <option value="mentor">Mentor</option>
        </select>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
          Signup
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
