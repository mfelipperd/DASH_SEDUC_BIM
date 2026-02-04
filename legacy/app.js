// Dashboard – Acompanhamento de Contrato (Jira CSV)

const THEME = {
  brand900: "#233952",
  brand600: "#4b709d",
  brand400: "#6c819e",
  accent:   "#e5d0b7",
  white:    "#ffffff",
  grid:     "rgba(255,255,255,.08)",
  ticks:    "rgba(255,255,255,.78)",
  legend:   "rgba(255,255,255,.86)",
};

// Status (cores do gráfico)
const STATUS_COLORS = {
  "Pendente": THEME.accent,
  "Em andamento": THEME.brand600,
  "Concluído": "rgba(127,191,155,.95)", // complementar (suave)
};

// =============================
// Utilitários
// =============================
const moneyBR = (cents) => {
  const v = Number.isFinite(cents) ? cents : 0;
  return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// Converte string numérica para CENTAVOS (robusto p/ "R$ 5.368,12", "6009,557", etc.)
function toCents(val) {
  if (val === null || val === undefined) return 0;
  let s = String(val).trim();
  if (!s) return 0;

  // remove "R$" e espaços (inclui NBSP)
  s = s.replace(/R\$\s?/g, "");
  s = s.replace(/[\s\u00A0]/g, "");
  s = s.trim();

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  // "5.368,12" -> "5368.12"
  if (hasComma && hasDot) s = s.replaceAll(".", "").replaceAll(",", ".");
  // "5368,12" -> "5368.12"
  else if (hasComma && !hasDot) s = s.replaceAll(",", ".");

  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function normalizeStatus(raw) {
  const s = (raw || "").trim();
  if (!s) return "";
  if (s === "Tarefas pendentes") return "Pendente";
  if (s === "Em andamento" || s === "Em Análise (interna)") return "Em andamento";
  if (s === "Concluído" || s === "Aprovado" || s === "Em Análise (SEDUC)") return "Concluído";
  return s;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[c]));
}

function uniqSorted(arr) {
  return [...new Set(arr
    .filter(v => v !== null && v !== undefined && String(v).trim() !== "")
    .map(v => String(v).trim())
  )].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function badgeStatus(norm) {
  const cls =
    norm === "Concluído" ? "b-ok" :
    norm === "Em andamento" ? "b-warn" :
    norm === "Pendente" ? "b-bad" : "";
  return `<span class="badge ${cls}"><span class="dot"></span>${escapeHtml(norm || "—")}</span>`;
}

// =============================
// Testes rápidos (console)
// =============================
(function runSelfTests() {
  const cases = [
    { input: "R$ 5.368,12", expected: 536812 },
    { input: "5.368,12", expected: 536812 },
    { input: "6009,557", expected: 600956 }, // arredonda
    { input: "6009.55", expected: 600955 },
    { input: "0", expected: 0 },
    { input: "", expected: 0 },
    { input: null, expected: 0 },
    { input: "R$\u00A05.368,12", expected: 536812 },
  ];
  let ok = 0;
  for (const c of cases) {
    const got = toCents(c.input);
    if (got === c.expected) ok++;
    else console.warn("[TESTE] toCents falhou:", c.input, "=>", got, "esperado", c.expected);
  }
  console.log(`[TESTES] toCents: ${ok}/${cases.length} OK`);
})();

// =============================
// Estado
// =============================
let rawRows = [];

const COL = {
  tipo: "Tipo de item",
  key: "Chave da item",
  resumo: "Resumo",
  status: "Status",
  categoria: "Campo personalizado (Categoria)",
  escola: "Campo personalizado (Escola)",
  valContratual: "Campo personalizado (Valor Contratual)",
  valMedido: "Campo personalizado (Valor Medido)",
  paiKey: "Chave pai",
};

let chartStatus, chartFinance, chartCategoria, chartEscolaSaldo;

// =============================
// CSV
// =============================
function parseCsvText(text, sourceLabel) {
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) console.warn("Erros CSV:", parsed.errors);

  rawRows = (parsed.data || []).map((r) => {
    const tipo = (r[COL.tipo] || "").trim();
    const key = (r[COL.key] || "").trim();
    const categoria = (r[COL.categoria] || "").trim();
    const escola = (r[COL.escola] || "").trim();
    const statusRaw = (r[COL.status] || "").trim();
    const statusNorm = normalizeStatus(statusRaw);

    return {
      _src: sourceLabel,
      tipo,
      key,
      resumo: (r[COL.resumo] || "").trim(),
      categoria,
      escola,
      statusRaw,
      statusNorm,
      valorContratualCents: toCents(r[COL.valContratual]),
      valorMedidoCents: toCents(r[COL.valMedido]),
      paiKey: (r[COL.paiKey] || "").trim(),
    };
  });

  document.getElementById("lastUpdate").textContent = `Fonte: ${sourceLabel}`;
  document.getElementById("rowsInfo").textContent = `${rawRows.length} linhas`;

  const tasks = rawRows.filter((r) => r.tipo === "Tarefa");
  const subtasks = rawRows.filter((r) => r.tipo === "Subtarefa");
  document.getElementById("tasksInfo").textContent = `${tasks.length} tarefas`;
  document.getElementById("subtasksInfo").textContent = `${subtasks.length} subtarefas`;

  hydrateFilters();
  ensureCharts();
  render();
}

async function fetchCsv(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Falha ao buscar CSV (${res.status})`);
  parseCsvText(await res.text(), url);
}

// =============================
// Filtros (sem disciplina)
// =============================
function hydrateFilters() {
  const selCat = document.getElementById("fCategoria");
  const selEsc = document.getElementById("fEscola");

  const prevCat = selCat.value;
  const prevEsc = selEsc.value;

  const cats = uniqSorted(rawRows.map((r) => r.categoria));
  const escolas = uniqSorted(rawRows.map((r) => r.escola));

  selCat.innerHTML = `<option value="">Todas</option>` + cats.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  selEsc.innerHTML = `<option value="">Todas</option>` + escolas.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");

  selCat.value = cats.includes(prevCat) ? prevCat : "";
  selEsc.value = escolas.includes(prevEsc) ? prevEsc : "";
}

function getFilters() {
  return {
    categoria: document.getElementById("fCategoria").value,
    escola: document.getElementById("fEscola").value,
    status: document.getElementById("fStatus").value,
    q: (document.getElementById("q").value || "").trim().toLowerCase(),
  };
}

function applyFilters(rows) {
  const f = getFilters();
  return rows.filter((r) => {
    if (f.categoria && r.categoria !== f.categoria) return false;
    if (f.escola && r.escola !== f.escola) return false;
    if (f.status && r.statusNorm !== f.status) return false;
    if (f.q) {
      const hay = `${r.key} ${r.resumo} ${r.categoria} ${r.escola}`.toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  });
}

// =============================
// Render
// =============================
function render() {
  const filtered = applyFilters(rawRows);
  renderKPIs(filtered);
  renderTasksTable(filtered);
  renderEntregaveis(filtered);
  renderCharts(filtered);
}

function renderKPIs(filtered) {
  const tasks = filtered.filter((r) => r.tipo === "Tarefa");
  const totalContratual = tasks.reduce((a, r) => a + (r.valorContratualCents || 0), 0);
  const totalMedido = tasks.reduce((a, r) => a + (r.valorMedidoCents || 0), 0);

  const concluidas = tasks.filter((r) => r.statusNorm === "Concluído");
  const saldoConcluidas = concluidas.reduce((a, r) => a + ((r.valorContratualCents || 0) - (r.valorMedidoCents || 0)), 0);

  const pct = totalContratual > 0 ? (totalMedido / totalContratual) * 100 : 0;

  document.getElementById("kContratual").textContent = moneyBR(totalContratual);
  document.getElementById("kMedido").textContent = moneyBR(totalMedido);
  document.getElementById("kSaldo").textContent = moneyBR(saldoConcluidas);
  document.getElementById("kPct").textContent = `${pct.toFixed(1)}%`;

  document.getElementById("kContratualHint").textContent = `Tarefas filtradas: ${tasks.length}`;
  document.getElementById("kMedidoHint").textContent = `Tarefas concluídas (para saldo): ${concluidas.length}`;
}

function renderTasksTable(filtered) {
  const tasks = filtered.filter((r) => r.tipo === "Tarefa");

  tasks.sort((a, b) =>
    (a.categoria || "").localeCompare(b.categoria || "", "pt-BR") ||
    (a.escola || "").localeCompare(b.escola || "", "pt-BR") ||
    (a.key || "").localeCompare(b.key || "", "pt-BR")
  );

  const tbody = document.getElementById("tbodyTasks");
  tbody.innerHTML = tasks.map((t) => {
    const saldo = t.statusNorm === "Concluído"
      ? (t.valorContratualCents || 0) - (t.valorMedidoCents || 0)
      : null;

    return `
      <tr>
        <td><b>${escapeHtml(t.key)}</b></td>
        <td>${escapeHtml(t.resumo || "")}</td>
        <td>${escapeHtml(t.categoria || "—")}</td>
        <td>${escapeHtml(t.escola || "—")}</td>
        <td>${badgeStatus(t.statusNorm)}</td>
        <td>${moneyBR(t.valorContratualCents || 0)}</td>
        <td>${moneyBR(t.valorMedidoCents || 0)}</td>
        <td>${saldo === null ? '<span class="muted">—</span>' : moneyBR(saldo)}</td>
      </tr>
    `;
  }).join("");

  document.getElementById("tasksTableInfo").textContent = `Exibindo ${tasks.length} tarefas (após filtros)`;
}

function renderEntregaveis(filtered) {
  const allTasks = filtered.filter((r) => r.tipo === "Tarefa");
  const allSubtasks = filtered.filter((r) => r.tipo === "Subtarefa");

  const subByParent = new Map();
  for (const st of allSubtasks) {
    const pk = st.paiKey || st.key;
    if (!pk) continue;
    if (!subByParent.has(pk)) subByParent.set(pk, []);
    subByParent.get(pk).push(st);
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

  document.getElementById("entregaveisInfo").textContent =
    `Entregáveis concluídos: ${conclEnt}/${totalEnt} (${pctEnt.toFixed(1)}%)`;

  // Barra global + equivalência financeira estimada
  const barEl = document.getElementById("entregaveisBar");
  const pctEl = document.getElementById("entregaveisPctInfo");
  const finEl = document.getElementById("entregaveisFinanceInfo");

  if (barEl) barEl.style.width = `${Math.max(0, Math.min(100, pctEnt)).toFixed(1)}%`;
  if (pctEl) pctEl.textContent = `${pctEnt.toFixed(1)}%`;

  const totalContratualCents = allTasks.reduce((a, t) => a + (t.valorContratualCents || 0), 0);

  const estimadoPorEntregaveisCents = rows.reduce((a, r) => {
    const ratio = r.total > 0 ? (r.concl / r.total) : 0;
    return a + Math.round((r.valorContratualCents || 0) * ratio);
  }, 0);

  const pctFin = totalContratualCents > 0 ? (estimadoPorEntregaveisCents / totalContratualCents) * 100 : 0;

  if (finEl) {
    finEl.textContent =
      `Equivalência estimada (entregáveis → financeiro): ${moneyBR(estimadoPorEntregaveisCents)} de ${moneyBR(totalContratualCents)} (${pctFin.toFixed(1)}%)`;
  }

  const tbody = document.getElementById("tbodyEntregaveis");
  tbody.innerHTML = rows.map((r) => {
    const label = r.total ? `${r.concl}/${r.total} (${r.pct.toFixed(0)}%)` : "—";
    return `
      <tr>
        <td><b>${escapeHtml(r.key)}</b></td>
        <td>${escapeHtml(r.resumo || "")}</td>
        <td>${escapeHtml(r.categoria || "—")}</td>
        <td>${escapeHtml(r.escola || "—")}</td>
        <td>${badgeStatus(r.statusNorm)}</td>
        <td>
          <div style="display:flex;flex-direction:column;gap:6px">
            <div class="progress"><div class="bar" style="width:${r.pct.toFixed(1)}%"></div></div>
            <div class="muted" style="font-size:11px">${label}</div>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// =============================
// Charts (com paleta)
// =============================
function ensureCharts() {
  const elStatus = document.getElementById("chartStatus");
  const elFinance = document.getElementById("chartFinance");
  const elCat = document.getElementById("chartCategoria");
  const elEsc = document.getElementById("chartEscolaSaldo");
  if (!elStatus || !elFinance || !elCat || !elEsc) return;

  // 1) STATUS -> AGORA É GRÁFICO DE BARRAS
  if (!chartStatus) {
    chartStatus = new Chart(elStatus, {
      type: "bar",
      data: { labels: ["Pendente", "Em andamento", "Concluído"], datasets: [{ label: "Tarefas", data: [0,0,0] }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = Number(ctx.raw || 0);
                const all = ctx.chart.data.datasets[0].data || [];
                const total = all.reduce((a,b) => a + Number(b || 0), 0);
                const pct = total > 0 ? (val / total) * 100 : 0;
                return ` ${val} tarefas (${pct.toFixed(1)}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: THEME.ticks },
            grid: { color: "rgba(255,255,255,.04)" }
          },
          y: {
            beginAtZero: true,
            ticks: { color: THEME.ticks, precision: 0 },
            grid: { color: THEME.grid }
          }
        }
      },
    });
  }

  // 2) FINANCEIRO (rosca continua)
  if (!chartFinance) {
    chartFinance = new Chart(elFinance, {
      type: "doughnut",
      data: {
        labels: ["Medido", "Saldo"],
        datasets: [{
          label: "R$",
          data: [0, 0],
          backgroundColor: [THEME.brand600, THEME.accent],
          borderColor: "rgba(255,255,255,.14)",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: THEME.legend } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${(ctx.raw || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}`
            }
          }
        }
      },
    });
  }

  // 3) CATEGORIA (barras)
  if (!chartCategoria) {
    chartCategoria = new Chart(elCat, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          { label: "Contratual", data: [], backgroundColor: "rgba(75,112,157,.70)", borderColor: THEME.brand600, borderWidth: 1 },
          { label: "Medido", data: [], backgroundColor: "rgba(229,208,183,.75)", borderColor: THEME.accent, borderWidth: 1 },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: THEME.legend } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${(ctx.raw||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}` } },
        },
        scales: {
          x: { ticks: { color: THEME.ticks }, grid: { color: "rgba(255,255,255,.04)" } },
          y: {
            beginAtZero: true,
            ticks: { color: THEME.ticks, callback: (v) => Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) },
            grid: { color: THEME.grid }
          }
        }
      }
    });
  }

  // 4) TOP ESCOLAS (saldo) horizontal
  if (!chartEscolaSaldo) {
    chartEscolaSaldo = new Chart(elEsc, {
      type: "bar",
      data: {
        labels: [],
        datasets: [{
          label: "Saldo (Contratual − Medido)",
          data: [],
          backgroundColor: "rgba(108,129,158,.70)",
          borderColor: THEME.brand400,
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: THEME.legend } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${(ctx.raw||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}` } },
        },
        scales: {
          x: {
            ticks: { color: THEME.ticks, callback: (v) => Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) },
            grid: { color: THEME.grid }
          },
          y: { ticks: { color: THEME.ticks }, grid: { color: "rgba(255,255,255,.04)" } }
        }
      }
    });
  }
}

function renderCharts(filtered) {
  if (!chartStatus || !chartFinance || !chartCategoria || !chartEscolaSaldo) return;

  const tasks = filtered.filter((r) => r.tipo === "Tarefa");

  // STATUS
  const order = ["Pendente", "Em andamento", "Concluído"];
  const byStatus = new Map(order.map((s) => [s, 0]));
  for (const t of tasks) byStatus.set(t.statusNorm || "—", (byStatus.get(t.statusNorm || "—") || 0) + 1);

  const statusData = order.map((s) => byStatus.get(s) || 0);
  chartStatus.data.labels = order;
  chartStatus.data.datasets[0].data = statusData;
  chartStatus.data.datasets[0].backgroundColor = order.map((s) => STATUS_COLORS[s] || THEME.brand400);
  chartStatus.update();

  // FINANCEIRO
  const totalContratual = tasks.reduce((a, r) => a + (r.valorContratualCents || 0), 0);
  const totalMedido = tasks.reduce((a, r) => a + (r.valorMedidoCents || 0), 0);
  const saldo = Math.max(0, totalContratual - totalMedido);

  chartFinance.data.datasets[0].data = [totalMedido / 100, saldo / 100];
  chartFinance.update();

  // CATEGORIA
  const byCat = new Map();
  for (const t of tasks) {
    const k = t.categoria || "—";
    if (!byCat.has(k)) byCat.set(k, { vc: 0, vm: 0 });
    byCat.get(k).vc += t.valorContratualCents || 0;
    byCat.get(k).vm += t.valorMedidoCents || 0;
  }

  const catLabels = [...byCat.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));
  chartCategoria.data.labels = catLabels;
  chartCategoria.data.datasets[0].data = catLabels.map((k) => (byCat.get(k).vc || 0) / 100);
  chartCategoria.data.datasets[1].data = catLabels.map((k) => (byCat.get(k).vm || 0) / 100);
  chartCategoria.update();

  // TOP 10 ESCOLAS (saldo)
  const byEsc = new Map();
  for (const t of tasks) {
    const k = t.escola || "—";
    byEsc.set(k, (byEsc.get(k) || 0) + ((t.valorContratualCents || 0) - (t.valorMedidoCents || 0)));
  }

  const top = [...byEsc.entries()].sort((a, b) => (b[1] || 0) - (a[1] || 0)).slice(0, 10);
  chartEscolaSaldo.data.labels = top.map(([k]) => k);
  chartEscolaSaldo.data.datasets[0].data = top.map(([, v]) => (v || 0) / 100);
  chartEscolaSaldo.update();
}

// =============================
// Eventos
// =============================
document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => parseCsvText(String(reader.result || ""), file.name);
  reader.readAsText(file);
});

document.getElementById("btnFetch").addEventListener("click", async () => {
  const url = (document.getElementById("autoUrl").value || "").trim();
  if (!url) return;
  try {
    await fetchCsv(url);
  } catch (err) {
    alert(
      "Não consegui carregar o CSV do caminho informado.\n\n" +
      "Se você estiver abrindo este HTML via file://, o browser pode bloquear o fetch.\n" +
      "Nesse caso, use o botão 'Carregar CSV'.\n\n" +
      "Para atualização automática: servidor local (http://localhost:8000)."
    );
    console.error(err);
  }
});

for (const id of ["fCategoria", "fEscola", "fStatus", "q"]) {
  document.getElementById(id).addEventListener("input", render);
  document.getElementById(id).addEventListener("change", render);
}

document.getElementById("btnClear").addEventListener("click", () => {
  document.getElementById("fCategoria").value = "";
  document.getElementById("fEscola").value = "";
  document.getElementById("fStatus").value = "";
  document.getElementById("q").value = "";
  render();
});

// Boot (tenta carregar ./dados.csv automaticamente)
(async function boot() {
  try { await fetchCsv(document.getElementById("autoUrl").value); } catch (_) {}
})();
