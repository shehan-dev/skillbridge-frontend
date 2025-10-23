"use client";
import { useAuth } from "@/context/AuthContext";
import { messagingApi } from "@/lib/api";
import { useState } from "react";

export default function Messages() {
  const { token } = useAuth();
  const [toUser, setToUser] = useState("");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  const send = async () => {
    await messagingApi.post("/messages", { toUserId: toUser, text },
      { headers: { Authorization: `Bearer ${token}` } });
    setMsg("Message sent");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Send Message</h1>
      <input className="border p-2 m-1" placeholder="To User ID" value={toUser} onChange={e => setToUser(e.target.value)} />
      <textarea className="border p-2 m-1" placeholder="Message" value={text} onChange={e => setText(e.target.value)} />
      <button className="bg-blue-600 text-white px-4 py-2" onClick={send}>Send</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}
