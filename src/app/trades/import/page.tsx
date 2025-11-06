
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTrades } from '@/context/trades-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getCurrencySymbol } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';
import type { Trade } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';

export default function ImportTradesPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const { pendingTrades, setTradesData, tradesData, clearPendingTrades, setInitialBalance } = useTrades();
  const { toast } = useToast();
  const currencySymbol = getCurrencySymbol(settings.preferences.currency);
  const [balance, setBalance] = useState('5000');

  const handleImport = () => {
    const numericBalance = parseFloat(balance);
    if (isNaN(numericBalance) || numericBalance <= 0) {
        toast({
            variant: 'destructive',
            title: 'Invalid Initial Balance',
            description: 'Please enter a valid positive number for the initial balance.',
        });
        return;
    }
    setInitialBalance(numericBalance);

    // Create a set of unique keys for existing trades to check for duplicates
    // Using a more robust key than just date and symbol
    const existingTradeKeys = new Set(
      tradesData.map(t => `${t.date}-${t.symbol}-${t.side}-${t.entry}-${t.exit}-${t.size}`)
    );

    // Filter out pending trades that already exist
    const newTrades = pendingTrades.filter(
      t => !existingTradeKeys.has(`${t.date}-${t.symbol}-${t.side}-${t.entry}-${t.exit}-${t.size}`)
    );

    if (newTrades.length === 0 && pendingTrades.length > 0) {
      toast({
        title: 'No New Trades to Import',
        description: 'All trades from the file already exist in your journal.',
      });
    } else if (newTrades.length > 0) {
      setTradesData([...newTrades, ...tradesData]);
      toast({
        title: 'Import Successful',
        description: `${newTrades.length} new trades have been added to your journal.`,
      });
    }

    clearPendingTrades();
    router.push('/trades');
  };

  const handleCancel = () => {
    clearPendingTrades();
    router.push('/trades');
  };

  if (!pendingTrades || pendingTrades.length === 0) {
    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>No Trades to Import</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">There are no trades to review. Please upload a file first.</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => router.push('/trades')}>Back to Trades</Button>
                </CardFooter>
            </Card>
        </div>
    )
  }

  const formatDate = (isoString: string) => {
    try {
        if (!isoString) return "N/A";
        return format(parseISO(isoString), 'PPp');
    } catch(e) {
        return 'Invalid Date';
    }
  }

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold font-headline">Review &amp; Import</h1>
            <p className="text-muted-foreground">Review your parsed trades before importing them.</p>
       </div>
        <Card>
            <CardHeader>
                <CardTitle>Set Initial Balance</CardTitle>
                <CardDescription>Enter the starting balance for this set of trades to ensure an accurate equity curve.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="initial-balance">Initial Balance ({currencySymbol})</Label>
                    <Input 
                        type="number" 
                        id="initial-balance" 
                        placeholder="e.g., 5000" 
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                    />
                </div>
            </CardContent>
        </Card>
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTrades.map((trade, index) => (
                  <TableRow key={trade.id || index}>
                    <TableCell>{formatDate(trade.date)}</TableCell>
                    <TableCell>{trade.symbol}</TableCell>
                    <TableCell>{trade.side}</TableCell>
                    <TableCell>{trade.size.toFixed(2)}</TableCell>
                    <TableCell>{trade.entry.toFixed(4)}</TableCell>
                    <TableCell>{trade.exit.toFixed(4)}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        trade.pl >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {currencySymbol}{trade.pl.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {pendingTrades.length} records to be imported.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleImport}>Import Now</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
