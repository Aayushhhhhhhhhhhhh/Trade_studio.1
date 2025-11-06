'use client';

import { Bar, BarChart, CartesianGrid, XAxis, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import type { PlByDayDataPoint } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { getCurrencySymbol } from '@/lib/utils';

const chartConfig = {
  pl: {
    label: 'P/L',
  },
  positive: {
    color: 'hsl(var(--chart-2))',
  },
  negative: {
    color: 'hsl(var(--destructive))',
  }
} satisfies ChartConfig;

interface PlByDayChartProps {
    data: PlByDayDataPoint[];
}

export function PlByDayChart({ data }: PlByDayChartProps) {
  const { settings } = useSettings();
  const currencySymbol = getCurrencySymbol(settings.preferences.currency);
  
  const mostProfitableDay = data.reduce((max, day) => day.pl > max.pl ? day : max, data[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>P/L by Day of Week</CardTitle>
         <CardDescription>
            Your most profitable day is <span className="font-bold text-success">{mostProfitableDay.day}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5, }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent
                formatter={(value, name, props) => (
                    <div className="flex flex-col">
                        <span>P/L: 
                            <span className={Number(value) >= 0 ? 'text-success' : 'text-destructive'}>
                                {` ${currencySymbol}${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                            </span>
                        </span>
                    </div>
                )}
              />}
            />
            <Bar dataKey="pl" radius={4}>
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pl >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'} />
                ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
