
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/context/analytics-context';
import { useSettings } from '@/context/settings-context';
import { getCurrencySymbol } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { WeekdayMetric, SymbolWinRate, SymbolMetric } from '@/lib/types';
import { BarChart2, CalendarDays, Target, Repeat } from 'lucide-react';
import { Progress } from '@/components/ui/progress';


const WeekdayStatCard = ({ title, data, icon }: { title: string, data: WeekdayMetric[], icon?: React.ReactNode}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
          {icon || <BarChart2 className="h-5 w-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          {data.map((item, index) => (
            <div key={item.day || index}>
              <p className="text-xs text-muted-foreground">{item.day}</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                 <span className={cn(
                    "h-2 w-2 rounded-full",
                    item.value >= 1 ? 'bg-success' : 'bg-destructive' // Adjusted logic for R:R
                 )} />
                <p className="text-lg font-bold">
                  {item.value.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const SymbolStatCard = ({ title, data, icon }: { title: string, data: SymbolMetric[], icon?: React.ReactNode}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
          {icon || <BarChart2 className="h-5 w-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
          {data.slice(0,6).map((item, index) => (
            <div key={item.symbol || index}>
              <p className="text-xs text-muted-foreground">{item.symbol}</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                 <span className={cn(
                    "h-2 w-2 rounded-full",
                    item.value >= 1 ? 'bg-success' : 'bg-destructive' // Green if R:R is 1 or more
                 )} />
                <p className="text-lg font-bold">
                  {item.value.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const WeekdayWinRateCard = ({ title, data }: { title: string; data: WeekdayMetric[] }) => {
    const maxWinRate = Math.max(...data.map(item => item.value), 0);

    const getBarColor = (value: number) => {
        if (value === maxWinRate && maxWinRate > 0) return 'bg-success';
        if (value >= maxWinRate * 0.8) return 'bg-yellow-500';
        return 'bg-destructive';
    };

    const getTextColor = (value: number) => {
        if (value === maxWinRate && maxWinRate > 0) return 'text-success';
        if (value >= maxWinRate * 0.8) return 'text-yellow-500';
        return 'text-destructive';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
                    <CalendarDays className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {data.map((item, index) => (
                    <div key={item.day || index} className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{item.day}</p>
                        <div className="flex items-center gap-4 w-1/2 md:w-2/3">
                           <p className={cn("text-sm font-bold w-10 text-right", getTextColor(item.value))}>
                                {item.value.toFixed(0)}%
                           </p>
                           <Progress value={item.value} indicatorClassName={getBarColor(item.value)} />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

const SymbolWinRateCard = ({ title, data }: { title: string; data: SymbolWinRate[] }) => {
    const maxWinRate = Math.max(...data.map(item => item.winRate), 0);

    const getBarColor = (value: number) => {
        if (value === maxWinRate && maxWinRate > 0) return 'bg-success';
        if (value >= 70) return 'bg-green-500';
        if (value >= 50) return 'bg-yellow-500';
        return 'bg-destructive';
    };

    const getTextColor = (value: number) => {
        if (value === maxWinRate && maxWinRate > 0) return 'text-success';
        if (value >= 70) return 'text-green-500';
        if (value >= 50) return 'text-yellow-500';
        return 'text-destructive';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
                    <Target className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {data.slice(0, 5).map((item, index) => (
                    <div key={item.symbol || index} className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground font-semibold">{item.symbol}</p>
                        <div className="flex items-center gap-4 w-1/2 md:w-2/3">
                           <p className={cn("text-sm font-bold w-12 text-right", getTextColor(item.winRate))}>
                                {item.winRate.toFixed(0)}%
                           </p>
                           <Progress value={item.winRate} indicatorClassName={getBarColor(item.winRate)} />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};


export default function AnalyticsPage() {
  const { settings } = useSettings();
  const currencySymbol = getCurrencySymbol(settings.preferences.currency);
  const { symbolPerformance, weekdayAvgRR, weekdayWinRate, symbolWinRate, symbolAvgRR } = useAnalytics();

  const formatCurrency = (value: number) => {
    return `${currencySymbol}${value.toFixed(2)}`;
  }
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <span className="text-[0.7rem] uppercase text-muted-foreground">
                Symbol
              </span>
              <span className="font-bold text-muted-foreground">{label}</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-[0.7rem] uppercase text-muted-foreground">
                Net P/L
              </span>
              <span className={`font-bold ${payload[0].value >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(payload[0].value)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const data = [...symbolPerformance].sort((a, b) => a.netPL - b.netPL);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your trading performance.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeekdayWinRateCard title="Weekday Win Rate" data={weekdayWinRate} />
        <SymbolWinRateCard title="Symbol Win Rate (Top 5)" data={symbolWinRate} />
        <WeekdayStatCard title="Weekday Avg R:R" data={weekdayAvgRR} icon={<Repeat className="h-5 w-5" />} />
        <SymbolStatCard title="Symbol Avg R:R (Top 6)" data={symbolAvgRR} icon={<Repeat className="h-5 w-5" />} />
      </div>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Net Profit/Loss by Symbol</CardTitle>
          <CardDescription>A visual summary of which symbols are most and least profitable.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))"/>
              <XAxis 
                type="number" 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatCurrency(value)}
                stroke="hsl(var(--muted-foreground))"
                />
              <YAxis 
                type="category" 
                dataKey="symbol" 
                width={80}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                interval={0}
                />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))'}} />
              <Bar dataKey="netPL" radius={[0, 8, 8, 0]}>
                <LabelList
                    dataKey="netPL"
                    position="right"
                    offset={8}
                    className="fill-foreground text-sm"
                    formatter={(value: number) => formatCurrency(value)}
                />
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.netPL >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
