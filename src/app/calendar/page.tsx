
'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowRightLeft, LineChart, Repeat, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useTrades } from '@/context/trades-context';
import { useSettings } from '@/context/settings-context';
import { getCurrencySymbol, cn } from '@/lib/utils';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  parseISO,
  isWithinInterval,
  addDays,
} from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Trade } from '@/lib/types';


type PnlData = {
  [key: string]: {
    pnl: number;
    trades: number;
  };
};

type DailySummary = {
    date: Date;
    trades: Trade[];
    totalPnl: number;
    totalTrades: number;
    winRate: number;
    avgRR: number;
};

const DayDetailsDialog = ({ summary, currencySymbol, isOpen, onOpenChange }: { summary: DailySummary | null, currencySymbol: string, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    if (!summary) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-card text-card-foreground">
                <DialogHeader>
                    <DialogTitle>Trading Details</DialogTitle>
                    <p className="text-sm text-muted-foreground">{format(summary.date, "MMMM dd, yyyy")}</p>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-background/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><LineChart className="h-4 w-4" /> Total P&L</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={cn("text-2xl font-bold", summary.totalPnl >= 0 ? 'text-success' : 'text-destructive')}>{currencySymbol}{summary.totalPnl.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-background/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Repeat className="h-4 w-4" /> Average R:R</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{summary.avgRR > 0 ? summary.avgRR.toFixed(2) : 'N/A'}</p>
                            </CardContent>
                        </Card>
                         <Card className="bg-background/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" /> Total Trades</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{summary.totalTrades}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-background/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Trophy className="h-4 w-4" /> Win Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{summary.winRate.toFixed(0)}%</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Symbol</TableHead>
                                    <TableHead>Side</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Entry</TableHead>
                                    <TableHead>Exit</TableHead>
                                    <TableHead className="text-right">P&L</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summary.trades.map(trade => (
                                    <TableRow key={trade.id}>
                                        <TableCell>{trade.symbol}</TableCell>
                                        <TableCell className={cn(trade.side === 'Buy' ? 'text-success' : 'text-destructive')}>{trade.side}</TableCell>
                                        <TableCell>{trade.size}</TableCell>
                                        <TableCell>{trade.entry.toFixed(2)}</TableCell>
                                        <TableCell>{trade.exit.toFixed(2)}</TableCell>
                                        <TableCell className={cn("text-right font-medium", trade.pl >= 0 ? 'text-success' : 'text-destructive')}>
                                            {currencySymbol}{trade.pl.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function CalendarPage() {
  const { tradesData, isLoading } = useTrades();
  const { settings } = useSettings();
  const currencySymbol = getCurrencySymbol(settings.preferences.currency);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateFilter, setDateFilter] = useState('this-month');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  const [selectedDaySummary, setSelectedDaySummary] = useState<DailySummary | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (dateFilter === 'this-month') {
      setCurrentDate(new Date());
    } else if (dateFilter === 'last-month') {
      setCurrentDate(subMonths(new Date(), 1));
    }
  }, [dateFilter]);
  
  useEffect(() => {
    if (dateFilter === 'custom' && customDateRange?.from) {
      setCurrentDate(customDateRange.from);
    }
  }, [customDateRange, dateFilter]);

  const monthlyTrades = useMemo(() => {
    if (!tradesData) return [];
    
    let range: {start: Date, end: Date};

    if (dateFilter === 'custom' && customDateRange?.from) {
        range = { start: customDateRange.from, end: customDateRange.to || customDateRange.from };
    } else {
        range = { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
    
    return tradesData.filter(trade => 
        isWithinInterval(parseISO(trade.date), range)
    );

  }, [tradesData, currentDate, dateFilter, customDateRange]);

  const pnlByDate = useMemo(() => {
    return monthlyTrades.reduce((acc: PnlData, trade) => {
      const tradeDateKey = format(parseISO(trade.date), 'yyyy-MM-dd');
      if (!acc[tradeDateKey]) {
        acc[tradeDateKey] = { pnl: 0, trades: 0 };
      }
      acc[tradeDateKey].pnl += trade.pl;
      acc[tradeDateKey].trades += 1;
      return acc;
    }, {});
  }, [monthlyTrades]);

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    let endDate = endOfWeek(monthEnd);

    // Ensure calendar grid has at least 5 weeks for consistent height
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    if (days.length < 35) {
      endDate = addDays(endDate, 35 - days.length);
    }

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);


  const monthPnl = monthlyTrades.reduce((sum, trade) => sum + trade.pl, 0);

  const dailyStats = Object.values(pnlByDate);
  const winningDays = dailyStats.filter(d => d.pnl > 0).length;
  const losingDays = dailyStats.filter(d => d.pnl < 0).length;
  const tradingDays = dailyStats.length;

  const totalCommissionsAndSwaps = monthlyTrades.reduce((acc, t) => acc + (t.commission || 0) + (t.swap || 0), 0);

  const totalMonthlyTrades = monthlyTrades.length;
  const winningMonthlyTrades = monthlyTrades.filter(t => t.pl > 0).length;
  const monthlyWinRate = totalMonthlyTrades > 0 ? (winningMonthlyTrades / totalMonthlyTrades) * 100 : 0;

  const handleDayClick = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const tradesOnDay = tradesData.filter(t => format(parseISO(t.date), 'yyyy-MM-dd') === dateKey);

    if(tradesOnDay.length === 0) return;

    const totalPnl = tradesOnDay.reduce((acc, t) => acc + t.pl, 0);
    const totalTrades = tradesOnDay.length;
    const winningTrades = tradesOnDay.filter(t => t.pl > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const wins = tradesOnDay.filter(t => t.pl > 0).reduce((acc, t) => acc + t.pl, 0);
    const losses = tradesOnDay.filter(t => t.pl < 0).reduce((acc, t) => acc + t.pl, 0);
    const winCount = tradesOnDay.filter(t => t.pl > 0).length;
    const lossCount = tradesOnDay.filter(t => t.pl < 0).length;

    const avgWin = winCount > 0 ? wins / winCount : 0;
    const avgLoss = lossCount > 0 ? Math.abs(losses / lossCount) : 0;
    const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;

    setSelectedDaySummary({
        date: day,
        trades: tradesOnDay,
        totalPnl,
        totalTrades,
        winRate,
        avgRR,
    });
    setIsDetailsOpen(true);
  }

  const renderCalendarCells = () => {
    return daysInMonth.map((day, index) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const data = pnlByDate[dateKey];
      const isCurrentMonth = isSameMonth(day, currentDate);
      
      let pnlContent = null;
      if (data) {
        pnlContent = (
          <p className={cn('text-[10px] md:text-xs mt-1 font-semibold break-all', data.pnl >= 0 ? 'text-success' : 'text-destructive')}>
            {currencySymbol}{data.pnl.toFixed(2)}
          </p>
        );
      }
      
      const isLastDayOfWeek = getDay(day) === 6;
      let weeklyPnlContent = null;
      if (isLastDayOfWeek) {
          const start = startOfWeek(day);
          const end = endOfWeek(day);
          const weekDates = eachDayOfInterval({start, end}).map(d => format(d, 'yyyy-MM-dd'));
          const weekPnl = weekDates.reduce((sum, date) => sum + (pnlByDate[date]?.pnl || 0), 0);

          if (weekPnl !== 0) {
            weeklyPnlContent = (
                <div className="absolute bottom-1 right-1 text-right">
                    <p className="text-[9px] md:text-[10px] text-muted-foreground">Week PNL</p>
                    <p className={cn('text-[10px] md:text-xs font-bold break-all', weekPnl > 0 ? 'text-success' : 'text-destructive')}>
                        {weekPnl > 0 ? '+' : ''}{currencySymbol}{weekPnl.toFixed(2)}
                    </p>
                </div>
            )
          }
      }

      return (
        <div
          key={day.toString() + index}
          className={cn(
            'relative h-20 md:h-28 border-t border-r p-1 md:p-2',
            isCurrentMonth ? 'bg-card' : 'bg-background',
            data && data.pnl > 0 && 'bg-success/20',
            data && data.pnl < 0 && 'bg-destructive/20',
            data && 'cursor-pointer hover:bg-accent'
          )}
          onClick={() => handleDayClick(day)}
        >
          <p className={cn('text-xs md:text-sm', isCurrentMonth ? 'text-foreground' : 'text-muted-foreground')}>
            {format(day, 'd')}
          </p>
          {pnlContent}
          {weeklyPnlContent}
        </div>
      );
    });
  };


  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 text-center font-semibold text-muted-foreground text-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 border-b">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 border-t border-r" />
                    ))}
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">PNL Calendar</h1>

      <Card>
        <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {dateFilter === 'custom' && customDateRange?.from ?
                 `${format(customDateRange.from, "LLL dd, y")} - ${customDateRange.to ? format(customDateRange.to, "LLL dd, y") : ''}`
                 : `Monthly Net PNL (${format(currentDate, 'MMMM yyyy')})`
              }
            </p>
            <p className={cn("text-4xl font-bold mt-1", monthPnl >= 0 ? 'text-success' : 'text-destructive')}>{currencySymbol}{monthPnl.toFixed(2)}</p>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Realized PNL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{currencySymbol}{monthPnl.toFixed(2)}</p>
          </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{monthlyWinRate.toFixed(1)}%</p>
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{currencySymbol}{totalCommissionsAndSwaps.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Trading Days</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tradingDays}</p>
            <p className="text-xs text-muted-foreground">{winningDays} W / {losingDays} L</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={(e) => { e.preventDefault(); setCurrentDate(subMonths(currentDate, 1)); }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={(e) => { e.preventDefault(); setCurrentDate(addMonths(currentDate, 1)); }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {dateFilter === 'custom' && (
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full md:w-[300px] justify-start text-left font-normal",
                      !customDateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange?.from ? (
                      customDateRange.to ? (
                        <>
                          {format(customDateRange.from, "LLL dd, y")} -{" "}
                          {format(customDateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(customDateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={customDateRange?.from}
                    selected={customDateRange}
                    onSelect={setCustomDateRange}
                    numberOfMonths={2}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
           <div className="grid grid-cols-7 text-center font-semibold text-muted-foreground text-xs md:text-sm">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 border-b">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {renderCalendarCells()}
          </div>
        </div>
      </div>
      <DayDetailsDialog summary={selectedDaySummary} currencySymbol={currencySymbol} isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
    </div>
  );
}
