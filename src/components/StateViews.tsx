import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Mark } from './Logo';

export function LoadingView({ text }: { text: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <Mark size={54} className="animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-ink-500">
          <Loader2 size={16} className="animate-spin text-brand-600" />
          {text}
        </div>
      </div>
    </div>
  );
}

export function ErrorView({ title, desc, detail, retryLabel, onRetry }: {
  title: string; desc: string; detail?: string; retryLabel: string; onRetry: () => void;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="card max-w-md p-7 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
          <AlertTriangle size={26} />
        </span>
        <h2 className="mt-4 text-lg font-bold text-ink-900">{title}</h2>
        <p className="mt-2 text-sm text-ink-500">
          {desc}
          {detail && <span className="mt-1 block break-words font-mono text-xs text-ink-400">{detail}</span>}
        </p>
        <button
          onClick={onRetry}
          className="focus-ring mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {retryLabel}
        </button>
      </div>
    </div>
  );
}

export function EmptyView({ text }: { text: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-center text-ink-400">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100">
          <Inbox size={26} />
        </span>
        <p className="text-sm font-medium">{text}</p>
      </div>
    </div>
  );
}
