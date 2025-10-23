"use client";
import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const { token } = useAuth();
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    if (token) {
      userApi.get("/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setMe(res.data));
    }
  }, [token]);

  if (!me) return <p>Loading...</p>;
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">My Profile</h1>
      <p>Name: {me.name}</p>
      <p>Email: {me.email}</p>
      <p>Role: {me.role}</p>
      <p>Domain: {me.primaryDomain}</p>
    </div>
  );
}
