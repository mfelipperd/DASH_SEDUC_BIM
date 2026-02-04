import React from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeSwitcher from "./ThemeSwitcher";

export default function Header() {
  return (
    <header>
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}>
            <Image 
              src="/logo-white.svg" 
              alt="Encibra Logo Light" 
              width={140} 
              height={30} 
              priority
              style={{ marginRight: "20px" }}
            />
            <div className="title-group">
              <h1>Dashboard – Interface Jira</h1>
              <p className="sub">
                Acompanhamento de contrato SEDUC BIM
              </p>
            </div>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <ThemeSwitcher />
          <div className="brandMark">
            <span className="dot"></span>
            <span className="brandText">SEDUC BIM</span>
          </div>
        </div>
      </div>
    </header>
  );
}
