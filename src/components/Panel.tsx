import React from "react";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function Panel({ children, className = "", style }: PanelProps) {
  return (
    <div className={`panel ${className}`} style={style}>
      {children}
    </div>
  );
}
