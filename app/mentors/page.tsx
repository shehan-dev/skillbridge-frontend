"use client";
import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";

export default function Mentors() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [domain, setDomain] = useState("backend");

  useEffect(() => {
    userApi.get(`/mentors?domain=${domain}`).then(res => setMentors(res.data));
  }, [domain]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Browse Mentors</h1>
      <select className="border p-2 mb-4" value={domain} onChange={e => setDomain(e.target.value)}>
        <option value="backend">Backend</option>
        <option value="frontend">Frontend</option>
        <option value="devops">DevOps</option>
        <option value="data">Data</option>
      </select>
      {mentors.map(m => (
        <div key={m.userId} className="border p-3 mb-2 rounded">
          <b>{m.name}</b> — {m.primaryDomain}  
          <p>Badges: {(m.badges || []).join(", ")}</p>
        </div>
      ))}
    </div>
  );
}
