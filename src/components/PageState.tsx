import { ReactNode } from "react";

type PageStateAction = {
  label: string;
  onClick?: () => void;
  to?: string;
};

type PageStateProps = {
  title: string;
  message: string;
  tone?: "neutral" | "error" | "warning" | "info";
  icon?: string;
  children?: ReactNode;
  actions?: PageStateAction[];
};

const toneClasses = {
  neutral: {
    border: "border-slate-200",
    shadow: "shadow-slate-200/40",
    icon: "bg-slate-100 text-slate-600",
  },
  error: {
    border: "border-rose-200",
    shadow: "shadow-rose-200/40",
    icon: "bg-rose-100 text-rose-600",
  },
  warning: {
    border: "border-amber-200",
    shadow: "shadow-amber-200/40",
    icon: "bg-amber-100 text-amber-700",
  },
  info: {
    border: "border-sky-200",
    shadow: "shadow-sky-200/40",
    icon: "bg-sky-100 text-sky-700",
  },
};

export default function PageState({
  title,
  message,
  tone = "neutral",
  icon,
  children,
  actions = [],
}: PageStateProps) {
  const classes = toneClasses[tone];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-10">
      <div className={`w-full max-w-xl rounded-3xl border ${classes.border} bg-white p-8 text-center shadow-sm ${classes.shadow}`}>
        {icon && (
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl text-2xl ${classes.icon}`}>
            {icon}
          </div>
        )}
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        {children}
        {actions.length > 0 && (
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {actions.map((action) =>
              action.to ? (
                <a
                  key={action.label}
                  href={action.to}
                  className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {action.label}
                </a>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {action.label}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
