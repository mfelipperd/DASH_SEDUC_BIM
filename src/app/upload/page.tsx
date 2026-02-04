"use client";

import React, { useState } from "react";
import Header from "@/components/Header";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/s3/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`Arquivo ${file.name} enviado com sucesso!`);
        setFile(null);
      } else {
        setMessage(`Erro: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Header />
      <main>
        <div className="panel" style={{ maxWidth: "600px", margin: "40px auto" }}>
          <div className="title">Upload de Novo CSV</div>
          <p className="muted small mt8">
            Selecione o arquivo CSV exportado do Jira para atualizar os dados do dashboard.
          </p>

          <form onSubmit={handleUpload} className="mt12">
            <div className="control">
              <label>Arquivo CSV</label>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                required
              />
            </div>

            <div className="mt12">
              <button type="submit" disabled={!file || uploading} style={{ width: "100%" }}>
                {uploading ? "Enviando..." : "Fazer Upload para S3"}
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt12 note ${message.includes("sucesso") ? "b-ok" : "b-bad"}`} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)" }}>
              {message}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
