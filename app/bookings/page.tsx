"use client";
import { useAuth } from "@/context/AuthContext";
import { bookingApi } from "@/lib/api";
import { useState } from "react";

export default function Bookings() {
  const { token } = useAuth();
  const [mentorId, setMentorId] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [msg, setMsg] = useState("");

  const book = async () => {
    try {
      const res = await bookingApi.post("/bookings",
        { mentorId, slotStart, slotEnd },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg("Booking confirmed: " + JSON.stringify(res.data));
    } catch (err: any) {
      setMsg("Error: " + err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Book a Mentor</h1>
      <input className="border p-2 m-1" placeholder="Mentor ID" value={mentorId} onChange={e => setMentorId(e.target.value)} />
      <input className="border p-2 m-1" type="datetime-local" value={slotStart} onChange={e => setSlotStart(e.target.value)} />
      <input className="border p-2 m-1" type="datetime-local" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} />
      <button className="bg-green-600 text-white px-4 py-2" onClick={book}>Book</button>
      {msg && <p className="mt-4">{msg}</p>}
    </div>
  );
}
