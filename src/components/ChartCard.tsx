import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ChartCard({ title, subtitle, icon, right, children, className = '', delay = 0 }: Props) {
  return (
    <section
      className={`card card-hover p-5 animate-fade-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
          )}
          <div>
            <h3 className="text-[14.5px] font-bold text-ink-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[11.5px] text-ink-500">{subtitle}</p>}
          </div>
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}
