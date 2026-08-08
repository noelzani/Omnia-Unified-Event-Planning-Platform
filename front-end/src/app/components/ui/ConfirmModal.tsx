import type { ElementType } from "react";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";
import { Button } from "./button";

type Variant = "danger" | "warning" | "brand";

type ConfirmModalProps = {
  open: boolean;
  variant?: Variant;
  icon?: ElementType;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  open,
  variant = "danger",
  icon,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) return null;

  const isDanger = variant === "danger";
  const isBrand = variant === "brand";

  const defaultLabel = isDanger ? "Delete" : "Confirm";

  const iconBg = isDanger ? "bg-red-100" : isBrand ? "bg-[#EABAB0]/30" : "bg-amber-100";
  const iconColor = isDanger ? "text-red-600" : isBrand ? "text-[#875A6B]" : "text-amber-600";
  const DefaultIcon = isDanger ? Trash2 : isBrand ? LogOut : AlertTriangle;
  const Icon = icon ?? DefaultIcon;

  const confirmCls = isDanger
    ? "bg-red-600 hover:bg-red-700 text-white border-0"
    : "bg-[#875A6B] hover:bg-[#6f4958] text-white border-0";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200 rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-start gap-4">
          <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
            <Icon className={`size-7 ${iconColor}`} />
          </div>
          <div className="pt-1">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {description && (
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
            )}
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl px-5"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-5 ${confirmCls}`}
          >
            {loading ? "Please wait…" : (confirmLabel ?? defaultLabel)}
          </Button>
        </div>
      </div>
    </div>
  );
}
