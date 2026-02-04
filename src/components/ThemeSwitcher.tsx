"use client";

import React, { useEffect, useState } from "react";
import { Palette, Check, Sun, Building2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Theme = "default" | "encibra";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("default");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-white/5 text-[var(--muted)] transition-all hover:border-[var(--accent)] hover:bg-white/10 hover:text-[var(--text)] hover:shadow-[0_0_0_4px_rgba(242,188,27,0.1)] data-[state=open]:border-[var(--accent)] data-[state=open]:bg-white/10 data-[state=open]:text-[var(--text)]"
          title="Alternar Tema"
        >
          <Palette size={18} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 border-[var(--line)] bg-[var(--bg)] p-2 shadow-2xl backdrop-blur-xl">
        <div className="mb-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted2)]">
          Selecione o Tema
        </div>
        
        <div className="flex flex-col gap-1">
          <button 
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-white/5",
              theme === 'default' ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text)]"
            )}
            onClick={() => toggleTheme('default')}
          >
            <Sun size={16} className={theme === 'default' ? "text-[var(--accent)]" : "text-[var(--muted)]"} />
            <span className="flex-1 text-sm font-semibold">Tema Padrão</span>
            {theme === 'default' && <Check size={14} className="text-[var(--accent)]" />}
          </button>

          <button 
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-white/5",
              theme === 'encibra' ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text)]"
            )}
            onClick={() => toggleTheme('encibra')}
          >
            <Building2 size={16} className={theme === 'encibra' ? "text-[var(--accent)]" : "text-[var(--muted)]"} />
            <span className="flex-1 text-sm font-semibold">Tema Empresa</span>
            {theme === 'encibra' && <Check size={14} className="text-[var(--accent)]" />}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
