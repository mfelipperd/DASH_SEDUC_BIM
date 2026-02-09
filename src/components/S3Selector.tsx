"use client";

import React, { useState, useEffect } from "react";

interface S3File {
  key: string;
  lastModified: string;
  size: number;
}

interface Props {
  onSelect: (key: string) => void;
  selectedKey: string;
  onFileChange: (key: string) => void;
}

export default function S3Selector({ onSelect, selectedKey, onFileChange }: Props) {
  const [files, setFiles] = useState<S3File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/s3/list", {
          headers: {
            "x-access-key": process.env.NEXT_PUBLIC_APP_READ_ONLY_KEY || "",
          },
        });
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);

          if (data.files.length > 0 && !selectedKey) {
            onFileChange(data.files[0].key);
            onSelect(data.files[0].key);
          }
        }
      } catch (err) {
        console.error("Error listing S3 files:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [selectedKey, onSelect, onFileChange]);

  return (
    <div className="control grow">
      <label>Selecionar CSV do S3</label>
      <div className="inline">
        <select
          id="s3File"
          className="grow"
          value={selectedKey}
          onChange={(e) => {
            const val = e.target.value;
            onFileChange(val);
            onSelect(val);
          }}
          disabled={loading}
        >
          {loading ? (
            <option>Carregando arquivos...</option>
          ) : files.length === 0 ? (
            <option>Nenhum CSV encontrado no bucket</option>
          ) : (
            files.map((f) => (
              <option key={f.key} value={f.key}>
                {f.key} ({new Date(f.lastModified).toLocaleDateString("pt-BR")})
              </option>
            ))
          )}
        </select>
        <button onClick={() => onSelect(selectedKey)} disabled={!selectedKey || loading}>
          {loading ? "..." : "Carregar dados"}
        </button>
      </div>
    </div>
  );
}
