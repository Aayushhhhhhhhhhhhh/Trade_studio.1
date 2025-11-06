
'use client';

import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import type { EquityDataPoint } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { getCurrencySymbol } from '@/lib/utils';

const chartConfig = {
  equity: {
    label: 'Equity',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface EquityChartProps {
    data: EquityDataPoint[];
    totalProfit: number;
}

export function EquityChart({ data, totalProfit }: EquityChartProps) {
  const { settings } = useSettings();
  const currencySymbol = getCurrencySymbol(settings.preferences.currency);

  const formatYAxis = (value: number) => `${currencySymbol}${(value / 1000).toFixed(0)}k`;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
         <CardDescription>
           Total Net P/L: <span className="font-bold text-lg">{currencySymbol}{totalProfit.toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart
            data={data}
            margin={{
              left: 0,
              right: 20,
              top: 5,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="fillEquity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-equity)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-equity)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="tradeNumber"
              tickLine={false}
              axisLine={false}
              tick={false}
            />
            <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatYAxis}
                width={40}
             />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent
                indicator="dot"
                labelFormatter={(value) => `Trade #${value}`}
                formatter={(value, name, props) => (
                    <span>
                        <span className="font-semibold">{name}: </span>
                        {props.payload.equity.toLocaleString(undefined, {style: 'currency', currency: settings.preferences.currency, minimumFractionDigits: 2})}
                    </span>
                )}
              />}
            />
            <Area
              dataKey="equity"
              type="natural"
              fill="url(#fillEquity)"
              stroke="var(--color-equity)"
              stackId="a"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
