import React from "react";
import { DashboardRow, moneyBR } from "@/utils/dashboard-helpers";

interface Props {
  data: DashboardRow[];
}

export default function KPIContainer({ data }: Props) {
  const tasks = data.filter((r) => r.tipo === "Tarefa");
  const totalContratual = tasks.reduce((a, r) => a + (r.valorContratualCents || 0), 0);
  const totalMedido = tasks.reduce((a, r) => a + (r.valorMedidoCents || 0), 0);

  const concluidas = tasks.filter((r) => r.statusNorm === "Concluído");
  const saldoConcluidas = concluidas.reduce((a, r) => a + ((r.valorContratualCents || 0) - (r.valorMedidoCents || 0)), 0);

  const pct = totalContratual > 0 ? (totalMedido / totalContratual) * 100 : 0;

  return (
    <div className="grid kpis mt12">
      <div className="kpi">
        <div className="label">Valor Contratual (Tarefas)</div>
        <div className="value">{moneyBR(totalContratual)}</div>
        <div className="hint">Tarefas filtradas: {tasks.length}</div>
      </div>

      <div className="kpi">
        <div className="label">Valor Medido (Tarefas)</div>
        <div className="value">{moneyBR(totalMedido)}</div>
        <div className="hint">Tarefas concluídas (para saldo): {concluidas.length}</div>
      </div>

      <div className="kpi">
        <div className="label">Saldo a Receber (Concluídas)</div>
        <div className="value">{moneyBR(saldoConcluidas)}</div>
        <div className="hint">Apenas Concluído/Aprovado/Em Análise (SEDUC)</div>
      </div>

      <div className="kpi">
        <div className="label">% Medido (Tarefas)</div>
        <div className="value">{pct.toFixed(1)}%</div>
        <div className="hint">(Valor Medido ÷ Valor Contratual)</div>
      </div>
    </div>
  );
}
