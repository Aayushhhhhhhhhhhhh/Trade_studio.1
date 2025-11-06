
export type Kpi = {
  title: string;
  value: string;
  rawValue: number;
  formatter?: (value: number) => string;
  isCurrency?: boolean;
  change: string;
  changeType: 'increase' | 'decrease';
  description?: string;
};

export type JournalState = {
  whyTrade: string;
  strategy: string;
  mistakes: string[];
  whatNext: string;
  followedRisk: boolean;
  followedDailyLimit: boolean;
  screenshotUrl?: string;
};

export type Trade = {
  id: string;
  date: string; // This will store the full ISO string for when the trade was opened
  dateClosed: string; // This will store the full ISO string for when the trade was closed
  symbol: string;
  side: 'Buy' | 'Sell';
  size: number;
  entry: number;
  exit: number;
  sl?: number;
  pl: number;
  commission?: number;
  swap?: number;
  rMultiple?: number;
  journal?: JournalState;
};

export type EquityDataPoint = {
  tradeNumber: number;
  equity: number;
};

export type JournalEntry = {
  id: string;
  date: string;
  content: string;
  tags: string[];
};

export type PlByDayDataPoint = {
  day: string;
  pl: number;
};

export type SymbolPerformance = {
    symbol: string;
    trades: number;
    netPL: number;
};

export type Drawdown = {
    value: number;
    percent: number;
};

export type WeekdayMetric = {
  day: string;
  value: number;
};

export type SymbolMetric = {
    symbol: string;
    value: number;
}

export type SymbolWinRate = {
    symbol: string;
    winRate: number;
};
