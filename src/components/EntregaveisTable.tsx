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

export default function EntregaveisTable({ data }: Props) {
  const allTasks = data.filter((r) => r.tipo === "Tarefa");
  const allSubtasks = data.filter((r) => r.tipo === "Subtarefa");

  const subByParent = new Map<string, DashboardRow[]>();
  for (const st of allSubtasks) {
    const pk = st.paiKey || st.key;
    if (!pk) continue;
    if (!subByParent.has(pk)) subByParent.set(pk, []);
    subByParent.get(pk)!.push(st);
  }

  const rows = allTasks.map((t) => {
    const list = subByParent.get(t.key) || [];
    const total = list.length;
    const concl = list.filter((x) => x.statusNorm === "Concluído").length;
    const pct = total > 0 ? (concl / total) * 100 : 0;
    return {
      key: t.key,
      resumo: t.resumo,
      categoria: t.categoria,
      escola: t.escola,
      statusNorm: t.statusNorm,
      total,
      concl,
      pct,
      valorContratualCents: t.valorContratualCents || 0,
    };
  });

  rows.sort((a, b) => a.pct - b.pct);

  const totalEnt = rows.reduce((a, r) => a + r.total, 0);
  const conclEnt = rows.reduce((a, r) => a + r.concl, 0);
  const pctEnt = totalEnt > 0 ? (conclEnt / totalEnt) * 100 : 0;

  const totalContratualCents = allTasks.reduce((a, t) => a + (t.valorContratualCents || 0), 0);

  const estimadoPorEntregaveisCents = rows.reduce((a, r) => {
    const ratio = r.total > 0 ? (r.concl / r.total) : 0;
    return a + Math.round((r.valorContratualCents || 0) * ratio);
  }, 0);

  const pctFin = totalContratualCents > 0 ? (estimadoPorEntregaveisCents / totalContratualCents) * 100 : 0;

  return (
    <Panel>
      <div className="between">
        <div>
          <div className="title">Progresso de Entregáveis (subtarefas) – por tarefa</div>
          <div className="muted small">
            Calculado a partir das subtarefas vinculadas ao <b>Pai/Chave pai</b>.
          </div>
        </div>
        <div className="muted small">
          Entregáveis concluídos: {conclEnt}/{totalEnt} ({pctEnt.toFixed(1)}%)
        </div>
      </div>

      <div className="mt10">
        <div className="between">
          <div className="muted small">Equivalência estimada (entregáveis → financeiro): {moneyBR(estimadoPorEntregaveisCents)} de {moneyBR(totalContratualCents)} ({pctFin.toFixed(1)}%)</div>
          <div className="muted small">{pctEnt.toFixed(1)}%</div>
        </div>
        <div className="progress big mt8">
          <div className="bar" style={{ width: `${pctEnt}%` }}></div>
        </div>
      </div>

      <div className="scroll max430 mt10">
        <table>
          <thead>
            <tr>
              <th className="w90">Chave</th>
              <th className="w220">Tarefa (Etapa/Escola)</th>
              <th>Categoria</th>
              <th>Escola</th>
              <th>Status</th>
              <th className="w150">Entregáveis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td><b>{r.key}</b></td>
                <td>{r.resumo || ""}</td>
                <td>{r.categoria || "—"}</td>
                <td>{r.escola || "—"}</td>
                <td><StatusBadge status={r.statusNorm} /></td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div className="progress">
                      <div className="bar" style={{ width: `${r.pct}%` }}></div>
                    </div>
                    <div className="muted" style={{ fontSize: "11px" }}>
                      {r.total ? `${r.concl}/${r.total} (${r.pct.toFixed(0)}%)` : "—"}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
