"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { DashboardRow } from "@/utils/dashboard-helpers";
import Panel from "./Panel";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const THEME = {
  brand900: "#233952",
  brand600: "#4b709d",
  brand400: "#6c819e",
  accent: "#e5d0b7",
  ticks: "rgba(255,255,255,.78)",
  grid: "rgba(255,255,255,.08)",
  legend: "rgba(255,255,255,.86)",
};

const STATUS_COLORS: Record<string, string> = {
  "Pendente": THEME.accent,
  "Em andamento": THEME.brand600,
  "Concluído": "rgba(127,191,155,.95)",
};

interface Props {
  data: DashboardRow[];
}

export default function DashboardCharts({ data }: Props) {
  const tasks = data.filter((r) => r.tipo === "Tarefa");

  // 1) Status Chart
  const statusOrder = ["Pendente", "Em andamento", "Concluído"];
  const statusCounts = statusOrder.map(s => tasks.filter(t => t.statusNorm === s).length);

  const statusData = {
    labels: statusOrder,
    datasets: [{
      data: statusCounts,
      backgroundColor: statusOrder.map(s => STATUS_COLORS[s] || THEME.brand400),
      borderRadius: 4,
    }]
  };

  // 2) Finance Chart
  const totalContratual = tasks.reduce((a, r) => a + r.valorContratualCents, 0);
  const totalMedido = tasks.reduce((a, r) => a + r.valorMedidoCents, 0);
  const saldo = Math.max(0, totalContratual - totalMedido);

  const financeData = {
    labels: ["Medido", "Saldo"],
    datasets: [{
      data: [totalMedido / 100, saldo / 100],
      backgroundColor: [THEME.brand600, THEME.accent],
      borderColor: "rgba(255,255,255,.14)",
      borderWidth: 1,
    }]
  };

  // 3) Category Chart
  const byCat = new Map<string, { vc: number, vm: number }>();
  tasks.forEach(t => {
    const k = t.categoria || "—";
    if (!byCat.has(k)) byCat.set(k, { vc: 0, vm: 0 });
    const entry = byCat.get(k)!;
    entry.vc += t.valorContratualCents;
    entry.vm += t.valorMedidoCents;
  });

  const catLabels = Array.from(byCat.keys()).sort((a,b) => a.localeCompare(b, "pt-BR"));
  const categoryData = {
    labels: catLabels,
    datasets: [
      { label: "Contratual", data: catLabels.map(k => byCat.get(k)!.vc / 100), backgroundColor: "rgba(75,112,157,.70)" },
      { label: "Medido", data: catLabels.map(k => byCat.get(k)!.vm / 100), backgroundColor: "rgba(229,208,183,.75)" },
    ]
  };

  // 4) Top Schools Chart
  const byEsc = new Map<string, number>();
  tasks.forEach(t => {
    const k = t.escola || "—";
    const s = (t.valorContratualCents - t.valorMedidoCents);
    byEsc.set(k, (byEsc.get(k) || 0) + s);
  });

  const topSchools = Array.from(byEsc.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const schoolData = {
    labels: topSchools.map(([k]) => k),
    datasets: [{
      label: "Saldo (Contratual − Medido)",
      data: topSchools.map(([, v]) => v / 100),
      backgroundColor: "rgba(108,129,158,.70)",
      borderColor: THEME.brand400,
      borderWidth: 1,
    }]
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: THEME.legend } },
    },
    scales: {
      x: { ticks: { color: THEME.ticks }, grid: { color: "rgba(255,255,255,.04)" } },
      y: { ticks: { color: THEME.ticks }, grid: { color: THEME.grid } },
    }
  };

  return (
    <div className="grid charts mt12">
      <Panel className="chartPanel">
        <div className="chartHead">Status das Tarefas</div>
        <div className="chartSub muted">Distribuição por status (após filtros)</div>
        <div className="chartBody">
          <Bar data={statusData} options={{...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: false }}}} />
        </div>
      </Panel>

      <Panel className="chartPanel">
        <div className="chartHead">Financeiro</div>
        <div className="chartSub muted">Medido x Saldo estimado (Contratual − Medido)</div>
        <div className="chartBody">
          <Doughnut data={financeData} options={{...commonOptions, scales: undefined}} />
        </div>
      </Panel>

      <Panel className="chartPanel spanFull">
        <div className="chartHead">Por Categoria (Etapa)</div>
        <div className="chartSub muted">Contratual x Medido (somente Tarefas)</div>
        <div className="chartBody tall">
          <Bar data={categoryData} options={commonOptions} />
        </div>
      </Panel>

      <Panel className="chartPanel spanFull">
        <div className="chartHead">Top 10 Escolas</div>
        <div className="chartSub muted">Saldo (Contratual − Medido) — maior para menor</div>
        <div className="chartBody tall">
          <Bar data={schoolData} options={{...commonOptions, indexAxis: "y"}} />
        </div>
      </Panel>
    </div>
  );
}
