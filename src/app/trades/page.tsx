
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCurrencySymbol, cn } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';
import { Separator } from '@/components/ui/separator';
import { useTrades } from '@/context/trades-context';
import type { Trade } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { subDays, startOfYear, isWithinInterval, parseISO, isToday, format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Trash2 } from 'lucide-react';


export default function TradesPage() {
  const { settings } = useSettings();
  const { tradesData, setTradesData, resetAllData, setSelectedTradeForJournal } = useTrades();
  const { toast } = useToast();
  const router = useRouter();
  const currencySymbol = getCurrencySymbol(settings.preferences.currency);

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  
  const [filters, setFilters] = useState({
    dateRange: 'all',
    symbol: 'all',
    strategy: 'all',
    emotion: 'all',
    side: 'all'
  });
  
  useEffect(() => {
    // Select first trade by default if list is not empty
    if (tradesData.length > 0 && !selectedTrade) {
      setSelectedTrade(filteredTrades[0]);
    } else if (tradesData.length === 0) {
      setSelectedTrade(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradesData]);

  useEffect(() => {
    if (tradesData.length > 0 && selectedTrade) {
      const tradeToSelect = tradesData.find(t => t.id === selectedTrade?.id) || null;
      setSelectedTrade(tradeToSelect);
    } else if (tradesData.length === 0) {
      setSelectedTrade(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradesData]);

  const handleFilterChange = (filterName: keyof typeof filters) => (value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setSelectedTrade(null);
  };

  const handleDeleteTrade = (tradeToDelete: Trade) => {
    if (!tradeToDelete) return;

    const updatedTrades = tradesData.filter(trade => trade.id !== tradeToDelete.id);
    
    setTradesData(updatedTrades);
    if(selectedTrade?.id === tradeToDelete.id) {
        setSelectedTrade(updatedTrades[0] || null);
    }
    
    toast({
        title: "Trade Deleted",
        description: `The trade on ${tradeToDelete?.date} has been removed.`,
    });
  };

  const handleEditTrade = (tradeToEdit: Trade) => {
      if (!tradeToEdit) return;
      router.push(`/trades/${tradeToEdit.id}/edit`);
  }

    const handleResetData = () => {
    resetAllData();
    toast({
        title: "Data Reset",
        description: "All your application data has been cleared."
    });
  }

  const handleGoToJournal = (trade: Trade) => {
    router.push(`/journal/${trade.id}/edit`);
  };

  const filteredTrades = useMemo(() => {
    const now = new Date();
    return tradesData.filter(trade => {
      if (filters.dateRange !== 'all') {
        const tradeDate = parseISO(trade.date);
        let interval;
        switch (filters.dateRange) {
          case 'today':
            if (!isToday(tradeDate)) return false;
            break;
          case 'last-7-days':
            interval = { start: subDays(now, 7), end: now };
            if (!isWithinInterval(tradeDate, interval)) return false;
            break;
          case 'last-30-days':
            interval = { start: subDays(now, 30), end: now };
            if (!isWithinInterval(tradeDate, interval)) return false;
            break;
          case 'this-year':
            interval = { start: startOfYear(now), end: now };
            if (!isWithinInterval(tradeDate, interval)) return false;
            break;
        }
      }

      if (filters.symbol !== 'all' && trade.symbol !== filters.symbol) {
        return false;
      }

      if (filters.side !== 'all' && trade.side.toLowerCase() !== filters.side) {
        return false;
      }
      
      if (filters.strategy !== 'all' && trade.journal?.strategy !== filters.strategy) {
          return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tradesData, filters]);

  const symbolStats = useMemo(() => {
    if (filters.symbol === 'all' || filteredTrades.length === 0) {
      return null;
    }
    const wins = filteredTrades.filter(t => t.pl > 0).length;
    const losses = filteredTrades.filter(t => t.pl < 0).length;
    const winRate = (wins / filteredTrades.length) * 100;
    return { wins, losses, winRate };
  }, [filteredTrades, filters.symbol]);

  const uniqueSymbols = useMemo(() => Array.from(new Set(tradesData.map(t => t.symbol))), [tradesData]);
  
  if (tradesData.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Card className="w-full max-w-md p-8">
                <CardContent className="space-y-4">
                    <h2 className="text-2xl font-semibold">No Trades Yet</h2>
                    <p className="text-muted-foreground">
                        You haven't imported or added any trades. Upload a file or add a new trade to get started.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button onClick={() => document.querySelector<HTMLButtonElement>('button:has(svg.lucide-upload)')?.click()}>
                          Upload File
                        </Button>
                        <Button variant="secondary" onClick={() => router.push('/trades/new')}>
                          Add Manually
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  const formatDate = (isoString: string) => {
    try {
        if (!isoString) return 'N/A';
        return format(parseISO(isoString), 'PPp');
    } catch(e) {
        return 'Invalid Date';
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className={cn("space-y-6 transition-all duration-500", selectedTrade ? "lg:col-span-2" : "lg:col-span-3")}>
        <div className="space-y-4">
            <h1 className="text-3xl font-bold">Trades</h1>
             <div className="flex flex-wrap items-center gap-2">
                <Select value={filters.dateRange} onValueChange={handleFilterChange('dateRange')}>
                    <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                    <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="last-7-days">Last 7 days</SelectItem>
                    <SelectItem value="last-30-days">Last 30 days</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filters.symbol} onValueChange={handleFilterChange('symbol')}>
                    <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                    <SelectValue placeholder="Symbol" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Symbols</SelectItem>
                        {uniqueSymbols.map(symbol => (
                            <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select value={filters.strategy} onValueChange={handleFilterChange('strategy')}>
                    <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                    <SelectValue placeholder="Strategy tag" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Strategies</SelectItem>
                        <SelectItem value="breakout">Breakout</SelectItem>
                        <SelectItem value="breakdown">Breakdown</SelectItem>
                        <SelectItem value="reversal">Reversal</SelectItem>
                        <SelectItem value="trendline-reversal">Trendline Reversal</SelectItem>
                        <SelectItem value="trendline-break">Trendline Break</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={filters.emotion} onValueChange={handleFilterChange('emotion')}>
                    <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                    <SelectValue placeholder="Emotion" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Emotions</SelectItem>
                        <SelectItem value="confident">Confident</SelectItem>
                        <SelectItem value="anxious">Anxious</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filters.side} onValueChange={handleFilterChange('side')}>
                    <SelectTrigger className="w-full sm:w-auto min-w-[120px]">
                    <SelectValue placeholder="Side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sides</SelectItem>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {symbolStats && (
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Performance for {filters.symbol}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-3 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Wins</p>
                <p className="text-lg font-bold text-success">{symbolStats.wins}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Losses</p>
                <p className="text-lg font-bold text-destructive">{symbolStats.losses}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-lg font-bold">{symbolStats.winRate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardContent className="p-0">
             <ScrollArea className="h-[600px] w-full">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="hidden md:table-cell">Date Opened</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="hidden sm:table-cell">Side</TableHead>
                    <TableHead className="text-right">P/L</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade, index) => (
                    <TableRow 
                        key={trade.id || index}
                        onClick={() => setSelectedTrade(trade)} 
                        data-state={selectedTrade?.id === trade.id ? 'selected' : ''} 
                        className="cursor-pointer"
                    >
                      <TableCell className="hidden md:table-cell whitespace-nowrap">{formatDate(trade.date)}</TableCell>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell className="hidden sm:table-cell">{trade.side}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          trade.pl >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {currencySymbol}
                        {trade.pl.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); handleEditTrade(trade)}}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this trade from your records.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDeleteTrade(trade); }}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Manage your application data.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    This will permanently clear all your imported trades and journal entries. This action cannot be undone.
                </p>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Reset All Data</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all your
                            trades and journal entries.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetData}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
      </div>

      <div className={cn(
        "lg:col-span-1 lg:sticky lg:top-20 transition-opacity duration-500",
        selectedTrade ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {selectedTrade && (
            <Card className="animate-in fade-in-0 zoom-in-95 duration-500">
            <CardHeader>
                <CardTitle>Trade Details</CardTitle>
                <CardDescription>Details for the selected trade.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between"><span>Symbol:</span> <span className="font-medium">{selectedTrade.symbol}</span></div>
                        <Separator/>
                        <div className="flex justify-between"><span>Side:</span> <span className="font-medium">{selectedTrade.side}</span></div>
                        <Separator/>
                        <div className="flex justify-between"><span>Size:</span> <span className="font-medium">{selectedTrade.size}</span></div>
                        <Separator/>
                        <div className="flex justify-between"><span>Entry Price:</span> <span className="font-medium">{selectedTrade.entry.toFixed(5)}</span></div>
                        <Separator/>
                        <div className="flex justify-between"><span>Exit Price:</span> <span className="font-medium">{selectedTrade.exit.toFixed(5)}</span></div>
                        <Separator/>
                        <div className="flex justify-between"><span>Profit/Loss:</span> <span className={`font-medium ${selectedTrade.pl >= 0 ? 'text-success' : 'text-destructive'}`}>{currencySymbol}{selectedTrade.pl.toFixed(2)}</span></div>
                        <Separator/>
                        <div className="flex justify-between"><span>Date Opened:</span> <span className="font-medium">{formatDate(selectedTrade.date)}</span></div>
                        <Separator/>
                        <div className="flex justify-between"><span>Date Closed:</span> <span className="font-medium">{formatDate(selectedTrade.dateClosed)}</span></div>
                    </div>
                    <Separator />
                    {selectedTrade.journal && selectedTrade.journal.whyTrade ? (
                        <Button variant="outline" className="w-full mt-4" onClick={() => handleGoToJournal(selectedTrade)}>
                            View/Edit Journal
                        </Button>
                    ) : (
                        <Button className="w-full mt-4" onClick={() => handleGoToJournal(selectedTrade)}>
                            Add Journal Entry
                        </Button>
                    )}
                </div>
            </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
