
'use client';

import { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import { useTrades } from '@/context/trades-context';
import { useSettings } from '@/context/settings-context';
import { getCurrencySymbol } from '@/lib/utils';
import type { Kpi, EquityDataPoint, PlByDayDataPoint, SymbolPerformance, Trade, WeekdayMetric, SymbolWinRate, SymbolMetric } from '@/lib/types';

type AnalyticsData = {
  displayKpis: Kpi[];
  equityData: EquityDataPoint[];
  plByDayData: PlByDayDataPoint[];
  symbolPerformance: SymbolPerformance[];
  netPl: number;
  currencySymbol: string;
  analyticsSummary: any;
  weekdayAvgPl: WeekdayMetric[];
  weekdayAvgRR: WeekdayMetric[];
  weekdayWinRate: WeekdayMetric[];
  symbolWinRate: SymbolWinRate[];
  symbolAvgRR: SymbolMetric[];
};

const AnalyticsContext = createContext<AnalyticsData>(null!);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

const calculateMetrics = (trades: Trade[], initialBalance: number) => {
  const totalTrades = trades.length;

  // Default state when there are no trades
  if (totalTrades === 0) {
    return {
      kpis: [],
      equityData: [{ tradeNumber: 0, equity: initialBalance }],
      plByDayData: [],
      symbolPerformance: [],
      netPl: 0,
      analyticsSummary: {},
      weekdayAvgPl: [],
      weekdayAvgRR: [],
      weekdayWinRate: [],
      symbolWinRate: [],
      symbolAvgRR: [],
      currentBalance: initialBalance,
    };
  }
  
  // CRITICAL FIX: Sort trades by date to ensure chronological calculation
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Correctly calculate equity curve
  let runningEquity = initialBalance;
  const equityData: EquityDataPoint[] = [{ tradeNumber: 0, equity: initialBalance }];

  sortedTrades.forEach((trade, index) => {
    runningEquity += trade.pl;
    equityData.push({ tradeNumber: index + 1, equity: runningEquity });
  });

  const winningTrades = sortedTrades.filter(t => t.pl > 0);
  const losingTrades = sortedTrades.filter(t => t.pl < 0);
  
  const netPl = sortedTrades.reduce((acc, t) => acc + t.pl, 0);
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  
  const totalWinAmount = winningTrades.reduce((acc, t) => acc + t.pl, 0);
  const totalLossAmount = losingTrades.reduce((acc, t) => acc + t.pl, 0);
  
  const avgWin = winningTrades.length > 0 ? totalWinAmount / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? Math.abs(totalLossAmount / losingTrades.length) : 0;

  const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;

  const maxEquity = Math.max(...equityData.map(d => d.equity));
  const currentBalance = equityData[equityData.length - 1]?.equity ?? initialBalance;

  const kpis: Omit<Kpi, 'change' | 'changeType' | 'value'>[] = [
    { title: 'Win Rate', rawValue: winRate, formatter: (v) => `${v.toFixed(1)}%` },
    { title: 'Avg R/R', rawValue: avgRR, formatter: (v) => v.toFixed(2) },
    { title: 'Max Equity', rawValue: maxEquity, isCurrency: true },
    { title: 'Current Balance', rawValue: currentBalance, isCurrency: true },
  ];

  const weekdayMetrics: { [day: string]: { pl: number, count: number, wins: number, totalWin: number, winCount: number, totalLoss: number, lossCount: number, rValueSum: number, rValueCount: number } } = {
    MON: { pl: 0, count: 0, wins: 0, totalWin: 0, winCount: 0, totalLoss: 0, lossCount: 0, rValueSum: 0, rValueCount: 0 },
    TUE: { pl: 0, count: 0, wins: 0, totalWin: 0, winCount: 0, totalLoss: 0, lossCount: 0, rValueSum: 0, rValueCount: 0 },
    WED: { pl: 0, count: 0, wins: 0, totalWin: 0, winCount: 0, totalLoss: 0, lossCount: 0, rValueSum: 0, rValueCount: 0 },
    THU: { pl: 0, count: 0, wins: 0, totalWin: 0, winCount: 0, totalLoss: 0, lossCount: 0, rValueSum: 0, rValueCount: 0 },
    FRI: { pl: 0, count: 0, wins: 0, totalWin: 0, winCount: 0, totalLoss: 0, lossCount: 0, rValueSum: 0, rValueCount: 0 },
  };
  const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const plByDayData: PlByDayDataPoint[] = [
    { day: 'Sun', pl: 0 }, { day: 'Mon', pl: 0 }, { day: 'Tue', pl: 0 }, 
    { day: 'Wed', pl: 0 }, { day: 'Thu', pl: 0 }, { day: 'Fri', pl: 0 }, { day: 'Sat', pl: 0 }
  ];
  sortedTrades.forEach(trade => {
    const tradeDate = new Date(trade.date);
    let dayIndex = tradeDate.getUTCDay();
    
    plByDayData[dayIndex].pl += trade.pl;
    const dayName = dayMap[dayIndex];

    if (dayName && dayName in weekdayMetrics) {
      const dayStats = weekdayMetrics[dayName];
      dayStats.pl += trade.pl;
      dayStats.count += 1;

      if (trade.pl > 0) {
        dayStats.wins += 1;
        dayStats.totalWin += trade.pl;
        dayStats.winCount += 1;
      } else if (trade.pl < 0) {
        dayStats.totalLoss += trade.pl;
        dayStats.lossCount += 1;
      }
      
      let rValue = 0;
      if (trade.rMultiple && isFinite(trade.rMultiple)) {
        rValue = trade.rMultiple;
      } else if (trade.sl && isFinite(trade.sl)) {
        const risk = Math.abs(trade.entry - trade.sl) * trade.size;
        if (risk > 0) {
          rValue = trade.pl / risk;
        }
      }
      
      if (isFinite(rValue)) {
        dayStats.rValueSum += rValue;
        dayStats.rValueCount += 1;
      }
    }
  });

  const weekdayAvgPl: WeekdayMetric[] = Object.entries(weekdayMetrics).map(([day, data]) => ({
    day,
    value: data.count > 0 ? data.pl / data.count : 0,
  }));
  
  const weekdayAvgRR: WeekdayMetric[] = Object.entries(weekdayMetrics).map(([day, data]) => {
      const avgWin = data.winCount > 0 ? data.totalWin / data.winCount : 0;
      const avgLoss = data.lossCount > 0 ? data.totalLoss / data.lossCount : 0;
      return {
          day,
          value: avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0,
      };
  });

  const weekdayWinRate: WeekdayMetric[] = Object.entries(weekdayMetrics).map(([day, data]) => ({
      day,
      value: data.count > 0 ? (data.wins / data.count) * 100 : 0,
  }));

  const symbolPerformanceMap = new Map<string, { trades: number; wins: number; netPL: number; totalWin: number; winCount: number; totalLoss: number; lossCount: number; }>();
  sortedTrades.forEach(trade => {
    const existing = symbolPerformanceMap.get(trade.symbol) || { trades: 0, wins: 0, netPL: 0, totalWin: 0, winCount: 0, totalLoss: 0, lossCount: 0 };
    existing.trades += 1;
    existing.netPL += trade.pl;
    if (trade.pl > 0) {
      existing.wins += 1;
      existing.totalWin += trade.pl;
      existing.winCount += 1;
    } else if (trade.pl < 0) {
      existing.totalLoss += trade.pl;
      existing.lossCount += 1;
    }
    symbolPerformanceMap.set(trade.symbol, existing);
  });

  const symbolPerformance = Array.from(symbolPerformanceMap.entries())
    .map(([symbol, data]) => ({ symbol, ...data }))
    .sort((a,b) => b.netPL - a.netPL);

  const symbolWinRate: SymbolWinRate[] = Array.from(symbolPerformanceMap.entries())
    .map(([symbol, data]) => ({
      symbol,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0
    }))
    .sort((a,b) => b.winRate - a.winRate);

  const symbolAvgRR: SymbolMetric[] = Array.from(symbolPerformanceMap.entries()).map(([symbol, data]) => {
    const avgWin = data.winCount > 0 ? data.totalWin / data.winCount : 0;
    const avgLoss = data.lossCount > 0 ? Math.abs(data.totalLoss / data.lossCount) : 0;
    return {
      symbol,
      value: avgLoss > 0 ? avgWin / avgLoss : 0,
    };
  }).sort((a,b) => b.value - a.value);


  const analyticsSummary = {
      netPl,
      winRate,
      avgRR,
      totalTrades,
      mostProfitableSymbol: symbolPerformance[0]?.symbol,
      leastProfitableSymbol: symbolPerformance[symbolPerformance.length - 1]?.symbol,
  };

  return { kpis, equityData, plByDayData, symbolPerformance, netPl, analyticsSummary, weekdayAvgPl, weekdayAvgRR, weekdayWinRate, symbolWinRate, symbolAvgRR, currentBalance };
};

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { tradesData, initialBalance } = useTrades();
  const { settings } = useSettings();
  
  const analyticsData = useMemo(() => {
    const currencySymbol = getCurrencySymbol(settings.preferences.currency);
    const { kpis, equityData, plByDayData, symbolPerformance, netPl, analyticsSummary, weekdayAvgPl, weekdayAvgRR, weekdayWinRate, symbolWinRate, symbolAvgRR, currentBalance } = calculateMetrics(tradesData, initialBalance);
    
    const displayKpis: Kpi[] = kpis.map(kpi => ({
      ...kpi,
      value: kpi.formatter ? kpi.formatter(kpi.rawValue) : (kpi.isCurrency ? `${currencySymbol}${kpi.rawValue.toFixed(2)}` : String(kpi.rawValue)),
      change: '', 
      changeType: 'increase' 
    }));

    displayKpis.unshift({
      title: 'Net P/L',
      value: `${currencySymbol}${netPl.toFixed(2)}`,
      rawValue: netPl,
      change: '',
      changeType: netPl >= 0 ? 'increase' : 'decrease'
    });
  
    return {
      displayKpis,
      equityData,
      plByDayData,
      symbolPerformance,
      netPl,
      currencySymbol,
      analyticsSummary,
      weekdayAvgPl,
      weekdayAvgRR,
      weekdayWinRate,
      symbolWinRate,
      symbolAvgRR,
    }
  }, [tradesData, initialBalance, settings.preferences.currency]);

  return (
    <AnalyticsContext.Provider value={analyticsData}>
      {children}
    </AnalyticsContext.Provider>
  );
}
