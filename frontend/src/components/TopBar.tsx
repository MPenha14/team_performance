import { Link } from "react-router-dom";
import { formatDateLabel } from "../utils/format";

interface TopBarProps {
  title: string;
  subtitle?: string;
  lastUpdated?: Date;
}

export function TopBar({ title, subtitle, lastUpdated }: TopBarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="text-xs text-slate-400">
            Última atualização: {formatDateLabel(lastUpdated)}
          </span>
        )}
        <Link
          to="/tv"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75h16.5v10.5H3.75V3.75ZM8.25 18.75h7.5M12 14.25v4.5" />
          </svg>
          Modo TV
        </Link>
      </div>
    </header>
  );
}
