"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Eye, EyeOff } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedKey = sessionStorage.getItem("upload_access_key");
    if (savedKey) {
      setAccessKey(savedKey);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "x-access-key": inputKey,
        },
      });

      if (res.ok) {
        sessionStorage.setItem("upload_access_key", inputKey);
        setAccessKey(inputKey);
      } else {
        setLoginError("Chave de acesso incorreta.");
      }
    } catch (err) {
      setLoginError("Erro ao validar chave. Tente novamente.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey) return;

    // UX Improvement: If no file, open the picker
    if (!file) {
      fileInputRef.current?.click();
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/s3/upload", {
        method: "POST",
        headers: {
          "x-access-key": accessKey,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`Arquivo ${file.name} enviado com sucesso!`);
        setFile(null);
      } else {
        setMessage(`Erro: ${data.error}`);
        if (res.status === 401) {
          setAccessKey(null);
          sessionStorage.removeItem("upload_access_key");
        }
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  if (!accessKey) {
    return (
      <>
        <Header />
        <main>
          <div className="panel" style={{ maxWidth: "400px", margin: "80px auto" }}>
            <div className="title">Acesso Restrito</div>
            <p className="muted small mt8">Insira a chave de acesso para realizar o upload de arquivos.</p>
            <form onSubmit={handleLogin} className="mt12">
              <div className="control">
                <label>Chave de Acesso</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    key="access-key-input"
                    type={showPassword ? "text" : "password"}
                    value={inputKey || ""}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Digite a chave..."
                    required
                    style={{ width: "100%", paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "8px",
                      background: "none",
                      border: "none",
                      padding: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--muted)",
                      boxShadow: "none",
                      filter: "none",
                      transform: "none"
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              {loginError && (
                <div className="mt8 small b-bad" style={{ color: "var(--red)", fontSize: "12px" }}>
                  {loginError}
                </div>
              )}

              <div className="mt12">
                <button type="submit" style={{ width: "100%" }} disabled={loginLoading}>
                  {loginLoading ? "Validando..." : "Entrar"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <div className="panel" style={{ maxWidth: "600px", margin: "40px auto" }}>
          <div className="flex-between align-center">
            <div className="title">Upload de Novo CSV</div>
            <button 
              className="small ghost" 
              onClick={() => {
                sessionStorage.removeItem("upload_access_key");
                setAccessKey(null);
              }}
            >
              Sair
            </button>
          </div>
          <p className="muted small mt8">
            Selecione o arquivo CSV exportado do Jira para atualizar os dados do dashboard.
          </p>

          <form onSubmit={handleUpload} className="mt12">
            <div className="control">
              <label>Arquivo CSV</label>
              <input
                ref={fileInputRef}
                key="file-upload-input"
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="mt12">
              <button type="submit" disabled={uploading} style={{ width: "100%" }}>
                {uploading ? "Enviando..." : file ? "Fazer Upload para S3" : "Selecionar Arquivo"}
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
