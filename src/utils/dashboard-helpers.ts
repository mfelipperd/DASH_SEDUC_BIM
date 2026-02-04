export const moneyBR = (cents: number) => {
  const v = Number.isFinite(cents) ? cents : 0;
  return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export function toCents(val: any): number {
  if (val === null || val === undefined) return 0;
  let s = String(val).trim();
  if (!s) return 0;

  s = s.replace(/R\$\s?/g, "");
  s = s.replace(/[\s\u00A0]/g, "");
  s = s.trim();

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) s = s.replaceAll(".", "").replaceAll(",", ".");
  else if (hasComma && !hasDot) s = s.replaceAll(",", ".");

  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function normalizeStatus(raw: string): string {
  const s = (raw || "").trim();
  if (!s) return "";
  if (s === "Tarefas pendentes") return "Pendente";
  if (s === "Em andamento" || s === "Em Análise (interna)") return "Em andamento";
  if (s === "Concluído" || s === "Aprovado" || s === "Em Análise (SEDUC)") return "Concluído";
  return s;
}

export function uniqSorted(arr: string[]): string[] {
  return [...new Set(arr
    .filter(v => v !== null && v !== undefined && String(v).trim() !== "")
    .map(v => String(v).trim())
  )].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export const COL = {
  tipo: "Tipo de item",
  key: "Chave da item",
  resumo: "Resumo",
  status: "Status",
  categoria: "Campo personalizado (Categoria)",
  escola: "Campo personalizado (Escola)",
  valContratual: "Campo personalizado (Valor Contratual)",
  valMedido: "Campo personalizado (Valor Medido)",
  paiKey: "Chave pai",
  disciplina: "Campo personalizado (Disciplina)",
};

export interface DashboardRow {
  tipo: string;
  key: string;
  resumo: string;
  statusRaw: string;
  statusNorm: string;
  categoria: string;
  escola: string;
  disciplina: string;
  valorContratualCents: number;
  valorMedidoCents: number;
  paiKey: string;
}
