import React from "react";
import { DashboardRow, moneyBR } from "@/utils/dashboard-helpers";

interface Props {
  data: DashboardRow[];
}

import StatusBadge from "./StatusBadge";
import Panel from "./Panel";

interface Props {
  data: DashboardRow[];
}

export default function TasksTable({ data }: Props) {
  const tasks = data.filter((r) => r.tipo === "Tarefa");

  tasks.sort((a, b) =>
    (a.categoria || "").localeCompare(b.categoria || "", "pt-BR") ||
    (a.escola || "").localeCompare(b.escola || "", "pt-BR") ||
    (a.key || "").localeCompare(b.key || "", "pt-BR")
  );

  return (
    <Panel className="mt12">
      <div className="between">
        <div>
          <div className="title">Lista de Tarefas (produtos medidos)</div>
          <div className="muted small">Dados vindos do arquivo selecionado no S3.</div>
        </div>
        <div className="muted small">Exibindo {tasks.length} tarefas (após filtros)</div>
      </div>

      <div className="scroll max520 mt10">
        <table>
          <thead>
            <tr>
              <th className="w90">Chave</th>
              <th className="w260">Resumo</th>
              <th>Categoria</th>
              <th>Escola</th>
              <th>Status</th>
              <th className="w140">Contratual</th>
              <th className="w130">Medido</th>
              <th className="w140">Saldo (se concluída)</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const saldo = t.statusNorm === "Concluído"
                ? (t.valorContratualCents || 0) - (t.valorMedidoCents || 0)
                : null;

              return (
                <tr key={t.key}>
                  <td><b>{t.key}</b></td>
                  <td>{t.resumo || ""}</td>
                  <td>{t.categoria || "—"}</td>
                  <td>{t.escola || "—"}</td>
                  <td><StatusBadge status={t.statusNorm} /></td>
                  <td>{moneyBR(t.valorContratualCents || 0)}</td>
                  <td>{moneyBR(t.valorMedidoCents || 0)}</td>
                  <td>{saldo === null ? <span className="muted">—</span> : moneyBR(saldo)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
