'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Kpi } from "@/lib/types";

type KpiCardProps = {
  kpi: Kpi;
};

export function KpiCard({ kpi }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
        {kpi.change && (
            <p className={cn(
                "text-xs",
                kpi.changeType === 'increase' ? 'text-success' : 'text-destructive'
            )}>
            {kpi.change}
            </p>
        )}
      </CardContent>
    </Card>
  );
}
