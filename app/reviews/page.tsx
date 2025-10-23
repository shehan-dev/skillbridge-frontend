"use client";
import { useAuth } from "@/context/AuthContext";
import { reviewApi } from "@/lib/api";
import { useState } from "react";

export default function Reviews() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState("");

  const requestReview = async () => {
    const res = await reviewApi.post("/reviews", {}, { headers: { Authorization: `Bearer ${token}` } });
    setUploadUrl(res.data.uploadUrl);
  };

  const uploadFile = async () => {
    if (!file || !uploadUrl) return;
    await fetch(uploadUrl, { method: "PUT", body: file });
    alert("File uploaded!");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Request Code Review</h1>
      <button className="bg-green-600 text-white px-4 py-2" onClick={requestReview}>Create Review</button>
      <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button className="bg-blue-600 text-white px-4 py-2" onClick={uploadFile}>Upload File</button>
    </div>
  );
}
