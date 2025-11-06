
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useTrades } from '@/context/trades-context';
import type { Trade } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/context/settings-context';
import { getCurrencySymbol } from '@/lib/utils';
import { format } from 'date-fns';

export default function JournalFeedPage() {
    const { tradesData, isLoading } = useTrades();
    const { settings } = useSettings();
    const currencySymbol = getCurrencySymbol(settings.preferences.currency);
    const router = useRouter();
    const [visibleTrades, setVisibleTrades] = useState(4);

    const tradesWithJournals = tradesData.filter(trade => trade.journal && trade.journal.whyTrade).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleViewDetails = (trade: Trade) => {
        router.push(`/journal/${trade.id}/edit`);
    };
    
    const handleNewEntry = () => {
        router.push('/trades');
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (tradesWithJournals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Card className="w-full max-w-md p-8">
                    <CardHeader>
                        <CardTitle className="text-2xl">Your Journal is Empty</CardTitle>
                        <CardDescription>
                            Add journal entries to your trades to see them here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/trades')}>Go to Trades</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Trading Journal</h1>
                    <p className="text-muted-foreground">View all your journal entries at a glance.</p>
                </div>
                <Button variant="outline" onClick={handleNewEntry}>New Entry</Button>
            </div>

            <div className="space-y-8">
                {tradesWithJournals.slice(0, visibleTrades).map(trade => (
                    <Card key={trade.id} className="overflow-hidden">
                        <CardHeader className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">{format(new Date(trade.date), 'PPP')}</p>
                                    <CardTitle className="text-2xl mt-1">{trade.symbol}</CardTitle>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Net P&L</p>
                                        <p className={cn("text-lg font-bold", trade.pl >= 0 ? 'text-success' : 'text-destructive')}>
                                            {currencySymbol}{trade.pl.toFixed(2)}
                                        </p>
                                    </div>
                                     {trade.rMultiple && (
                                         <div className="text-right">
                                            <p className="text-sm text-muted-foreground">R-Multiple</p>
                                            <p className={cn("text-lg font-bold", trade.rMultiple >= 0 ? 'text-success' : 'text-destructive')}>
                                                {trade.rMultiple.toFixed(2)}R
                                            </p>
                                        </div>
                                     )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                             <div className="md:col-span-1">
                                {trade.journal?.screenshotUrl ? (
                                    <Image
                                        src={trade.journal.screenshotUrl}
                                        alt={`Screenshot for ${trade.symbol}`}
                                        width={600}
                                        height={400}
                                        className="rounded-lg object-cover aspect-[4/3] border"
                                    />
                                ) : (
                                    <div className="bg-muted rounded-lg aspect-[4/3] flex items-center justify-center text-muted-foreground border">
                                        No Screenshot
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">Entry Reason / Notes</p>
                                <p className="mt-2 text-foreground/90 leading-relaxed">{trade.journal?.whyTrade}</p>
                                
                                <Separator className="my-4"/>
                                <p className="text-sm text-muted-foreground">Strategy: <span className="font-medium text-foreground">{trade.journal?.strategy}</span></p>
                                
                                {trade.journal && (
                                    <>
                                        <Separator className="my-4"/>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">Followed risk per trade?</p>
                                                {trade.journal.followedRisk ? <CheckCircle className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-destructive" />}
                                            </div>
                                             <div className="flex items-center justify-between">
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">Followed daily trade limit?</p>
                                                {trade.journal.followedDailyLimit ? <CheckCircle className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-destructive" />}
                                            </div>
                                        </div>
                                    </>
                                )}

                            </div>
                        </CardContent>
                         <CardFooter className="bg-muted/50 px-6 py-3">
                             <Button variant="link" className="p-0 h-auto text-sm" onClick={() => handleViewDetails(trade)}>
                                View Full Analysis & Edit <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {visibleTrades < tradesWithJournals.length && (
                <div className="text-center">
                    <Button variant="outline" onClick={() => setVisibleTrades(prev => prev + 4)}>Load More</Button>
                </div>
            )}
        </div>
    );
}
