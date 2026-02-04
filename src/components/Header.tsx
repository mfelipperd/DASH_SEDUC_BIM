import React from "react";
import Link from "next/link";

export default function Header() {
  return (
    <header>
      <div className="topbar">
        <div>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <h1>Dashboard – Acompanhamento de Contrato (Jira → CSV)</h1>
          </Link>
          <p className="sub">
            Acompanhamento de contrato SEDUC BIM
          </p>
        </div>

        <div className="brandMark">
          <span className="dot"></span>
          <span className="brandText">SEDUC BIM</span>
        </div>
      </div>
    </header>
  );
}
