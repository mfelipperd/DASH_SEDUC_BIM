"use client";

import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import {
  DashboardRow,
  COL,
  normalizeStatus,
  toCents,
  uniqSorted,
  moneyBR
} from "@/utils/dashboard-helpers";
import KPIContainer from "./KPIContainer";
import DashboardCharts from "./DashboardCharts";
import TasksTable from "./TasksTable";
import EntregaveisTable from "./EntregaveisTable";
import FilterControls from "./FilterControls";
import S3Selector from "./S3Selector";
import Panel from "./Panel";

export default function Dashboard() {
  const [rawData, setRawData] = useState<DashboardRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sourceLabel, setSourceLabel] = useState("Nenhum arquivo selecionado");


  const [filters, setFilters] = useState({
    categoria: "",
    escola: "",
    status: "",
    query: "",
  });


  const loadCSVS3 = async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/s3/content?key=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error("Falha ao carregar arquivo");
      const text = await res.text();
      processCSVText(text, `S3: ${key}`);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar CSV do S3");
    } finally {
      setLoading(false);
    }
  };



  const processCSVText = (text: string, label: string) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        const rows: DashboardRow[] = results.data.map((r: any) => ({
          tipo: (r[COL.tipo] || "").trim(),
          key: (r[COL.key] || "").trim(),
          resumo: (r[COL.resumo] || "").trim(),
          statusRaw: (r[COL.status] || "").trim(),
          statusNorm: normalizeStatus(r[COL.status]),
          categoria: (r[COL.categoria] || "").trim(),
          escola: (r[COL.escola] || "").trim(),
          disciplina: (r[COL.disciplina] || "").trim(),
          valorContratualCents: toCents(r[COL.valContratual]),
          valorMedidoCents: toCents(r[COL.valMedido]),
          paiKey: (r[COL.paiKey] || "").trim(),
        }));
        setRawData(rows);
        setSourceLabel(label);
      },
    });
  };


  const filteredData = useMemo(() => {
    return rawData.filter((r) => {
      if (filters.categoria && r.categoria !== filters.categoria) return false;
      if (filters.escola && r.escola !== filters.escola) return false;
      if (filters.status && r.statusNorm !== filters.status) return false;
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const hay = `${r.key} ${r.resumo} ${r.categoria} ${r.escola}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rawData, filters]);


  const categories = useMemo(() => uniqSorted(rawData.map((r) => r.categoria)), [rawData]);
  const schools = useMemo(() => uniqSorted(rawData.map((r) => r.escola)), [rawData]);

  return (
    <main>
      <Panel>
        <div className="controls">
          <S3Selector onSelect={loadCSVS3} selectedKey={selectedFile} onFileChange={setSelectedFile} />

        </div>

        <hr className="sep" />

        <FilterControls
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          schools={schools}
        />
      </Panel>

      <div className="topbar mt12">
        <div className="sub">
          <span className="pill">Fonte: {sourceLabel}</span>
          <span className="pill">{rawData.length} linhas</span>
          <span className="pill">{rawData.filter(r => r.tipo === "Tarefa").length} tarefas</span>
          <span className="pill">{rawData.filter(r => r.tipo === "Subtarefa").length} subtarefas</span>
        </div>
      </div>

      <KPIContainer data={filteredData} />

      <DashboardCharts data={filteredData} />

      <div className="row mt12">
        <EntregaveisTable data={filteredData} />

        <Panel>
          <div className="title">Regras aplicadas</div>
          <div className="note mt8">
            <ul className="rules">
              <li><b>Status normalizado</b>:
                <ul>
                  <li>“Tarefas pendentes” → <b>Pendente</b></li>
                  <li>“Em andamento” ou “Em Análise (interna)” → <b>Em andamento</b></li>
                  <li>“Concluído” ou “Aprovado” ou “Em Análise (SEDUC)” → <b>Concluído</b></li>
                </ul>
              </li>
              <li><b>Saldo a Receber</b> (somente tarefas concluídas): <b>Valor Contratual − Valor Medido</b></li>
              <li><b>Financeiro</b>: soma apenas <b>Tarefas</b>. Subtarefas entram só no progresso.</li>
              <li><b>Equivalência (entregáveis → financeiro)</b>: soma ponderada por valor, usando % de subtarefas concluídas por tarefa.</li>
            </ul>
          </div>
        </Panel>
      </div>

      <TasksTable data={filteredData} />
    </main>
  );
}
