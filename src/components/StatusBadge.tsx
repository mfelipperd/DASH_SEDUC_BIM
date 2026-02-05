import React from "react";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls =
    status === "Concluído" ? "b-ok" :
    status === "Em andamento" ? "b-warn" :
    status === "Pendente" ? "b-bad" : "";

  return (
    <span className={`badge ${cls}`}>
      <span className="dot"></span>
      {status || "—"}
    </span>
  );
}
