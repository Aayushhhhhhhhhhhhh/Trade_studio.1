'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTrades } from '@/context/trades-context';
import { useSettings } from '@/context/settings-context';
import { getCurrencySymbol } from '@/lib/utils';
import type { Trade, EquityDataPoint, PlByDayDataPoint, SymbolPerformance, Kpi } from '@/lib/types';
import { useAnalytics } from '@/context/analytics-context';

const EquityChart = dynamic(
  () => import('@/components/dashboard/equity-chart').then((mod) => mod.EquityChart),
  {
    ssr: false,
    loading: () => <div className="h-[250px] w-full bg-muted rounded-lg" />,
  }
);

const PlByDayChart = dynamic(
  () => import('@/components/dashboard/pl-by-day-chart').then((mod) => mod.PlByDayChart),
  {
    ssr: false,
    loading: () => <div className="h-[250px] w-full bg-muted rounded-lg" />,
  }
);

export default function ClientDashboard() {
  const { tradesData } = useTrades();
  const { settings } = useSettings();
  const currencySymbol = getCurrencySymbol(settings.preferences.currency);
  const { displayKpis, equityData, plByDayData, symbolPerformance, netPl } = useAnalytics();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {tradesData.length > 0 ? (
        <>
          <div>
            <h2 className="text-xl font-semibold mb-4">Key Performance Indicators</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {displayKpis.map((kpi) => (
                <KpiCard key={kpi.title} kpi={kpi} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Insights</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EquityChart data={equityData} totalProfit={netPl} />
              <PlByDayChart data={plByDayData} />
            </div>
          </div>
        </>
      ) : (
        <Card className="text-center py-12">
            <CardHeader>
                <CardTitle>No Trades Found</CardTitle>
                <CardContent>
                    <p className="text-muted-foreground">Upload your trades to see your performance dashboard.</p>
                </CardContent>
            </CardHeader>
        </Card>
      )}
    </div>
  );
}
