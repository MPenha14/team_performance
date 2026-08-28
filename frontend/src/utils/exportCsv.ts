function escapeCsvValue(value: unknown): string {
  const str = String(value ?? "");
  if (/[",;\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const lines = [headers.map(escapeCsvValue).join(";")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvValue).join(";"));
  }

  // BOM para o Excel reconhecer acentuacao em UTF-8 corretamente
  const csvContent = "﻿" + lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
