"use client";
import { useAuth } from "@/context/AuthContext";
import { paymentApi } from "@/lib/api";
import { useState } from "react";

export default function Payments() {
  const { token } = useAuth();
  const [session, setSession] = useState<any>(null);

  const checkout = async () => {
    const res = await paymentApi.post("/payments/checkout",
      { amount: 5000, currency: "usd", bookingId: "123" },
      { headers: { Authorization: `Bearer ${token}` } });
    setSession(res.data);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Payments</h1>
      <button className="bg-purple-600 text-white px-4 py-2" onClick={checkout}>Pay Now</button>
      {session && <p>Checkout URL: {session.url}</p>}
    </div>
  );
}
