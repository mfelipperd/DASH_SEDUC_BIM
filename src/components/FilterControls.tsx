import React from "react";

interface Props {
  filters: {
    categoria: string;
    escola: string;
    status: string;
    query: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    categoria: string;
    escola: string;
    status: string;
    query: string;
  }>>;
  categories: string[];
  schools: string[];
}

export default function FilterControls({ filters, setFilters, categories, schools }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { id, value } = e.target;
    setFilters((prev) => ({ ...prev, [id]: value }));
  };

  const clearFilters = () => {
    setFilters({
      categoria: "",
      escola: "",
      status: "",
      query: "",
    });
  };

  return (
    <div className="controls">
      <div className="control">
        <label>Filtro – Categoria (Etapa)</label>
        <select id="categoria" value={filters.categoria} onChange={handleChange}>
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="control">
        <label>Filtro – Escola</label>
        <select id="escola" value={filters.escola} onChange={handleChange}>
          <option value="">Todas</option>
          {schools.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="control">
        <label>Filtro – Status normalizado</label>
        <select id="status" value={filters.status} onChange={handleChange}>
          <option value="">Todos</option>
          <option value="Pendente">Pendente</option>
          <option value="Em andamento">Em andamento</option>
          <option value="Concluído">Concluído</option>
        </select>
      </div>

      <div className="control grow">
        <label>Busca (Chave/Resumo)</label>
        <input 
          id="query" 
          className="grow" 
          type="search" 
          placeholder="Ex.: PA-198, SILVESTRE, A2..." 
          value={filters.query}
          onChange={handleChange}
        />
      </div>

      <div className="control">
        <label>&nbsp;</label>
        <button className="btnGhost" onClick={clearFilters}>Limpar filtros</button>
      </div>
    </div>
  );
}
