import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
}

export function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-surface border border-white/5 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium mt-2", trend.positive ? "text-green-400" : "text-red-400")}>
              {trend.positive ? "\u2191" : "\u2193"} {trend.value}
            </p>
          )}
        </div>
        <div className="w-10 h-10 bg-brand-coral/10 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-coral" />
        </div>
      </div>
    </div>
  );
}
