
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrades } from '@/context/trades-context';
import { JournalState } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, ImageIcon, ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const journalMistakes = [
    { id: "entered-early", label: "Entered Early" },
    { id: "moved-stop", label: "Moved Stop" },
    { id: "fomo", label: "FOMO" },
    { id: "skipped-plan", label: "Skipped Plan" },
    { id: "late-exit", label: "Late Exit" },
];

const defaultJournalState: JournalState = {
    whyTrade: '',
    strategy: 'breakout',
    mistakes: [],
    whatNext: '',
    followedRisk: false,
    followedDailyLimit: false,
    screenshotUrl: '',
};

export default function EditJournalPage() {
  const { tradesData, updateTrade, isLoading } = useTrades();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const tradeId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [journalState, setJournalState] = useState<JournalState>(defaultJournalState);
  
  const selectedTrade = useMemo(() => {
    return tradesData.find(trade => trade.id === tradeId);
  }, [tradesData, tradeId]);

  const isExistingEntry = useMemo(() => {
    return !!(selectedTrade?.journal && (selectedTrade.journal.whyTrade || selectedTrade.journal.whatNext || selectedTrade.journal.mistakes.length > 0));
  }, [selectedTrade]);

  useEffect(() => {
    if (selectedTrade) {
      setJournalState(selectedTrade.journal || defaultJournalState);
    }
  }, [selectedTrade]);

  const handleUpdate = () => {
    if (selectedTrade) {
      updateTrade(selectedTrade.id, { journal: journalState });
      toast({
        title: isExistingEntry ? 'Journal Updated' : 'Journal Added',
        description: `Your journal for the ${selectedTrade.symbol} trade has been saved.`,
      });
      router.push('/journal');
    }
  };

  const handleMistakeChange = (mistakeId: string, checked: boolean) => {
    setJournalState(prevState => {
        const newMistakes = checked
            ? [...prevState.mistakes, mistakeId]
            : prevState.mistakes.filter(m => m !== mistakeId);
        return { ...prevState, mistakes: newMistakes };
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload an image file.' });
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        setJournalState(prev => ({ ...prev, screenshotUrl: reader.result as string }));
        toast({ title: 'Screenshot Uploaded', description: 'The new screenshot has been added.' });
    };
    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Error Reading File', description: 'There was an issue uploading your screenshot.'});
    };
    reader.readAsDataURL(file);
  };


  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!selectedTrade) {
    return <div>Trade not found.</div>;
  }

  return (
    <div className="space-y-4">
       <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Journal Entry</h1>
            <p className="text-muted-foreground">
                {selectedTrade.symbol} - {new Date(selectedTrade.date).toLocaleString()}
            </p>
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1 space-y-6">
           <Card>
                <CardHeader>
                    <CardTitle>Trade Screenshot</CardTitle>
                </CardHeader>
                <CardContent>
                    {journalState.screenshotUrl ? (
                        <Image src={journalState.screenshotUrl} alt="Trade Screenshot" width={600} height={400} className="rounded-lg object-cover w-full aspect-video" />
                    ) : (
                         <div className="aspect-video w-full bg-muted rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <ImageIcon className="h-10 w-10" />
                            <span>No Screenshot</span>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <Button variant="outline" className="w-full mt-4" onClick={handleUploadClick}>
                        <Upload className="mr-2 h-4 w-4" /> {journalState.screenshotUrl ? 'Change Screenshot' : 'Upload Screenshot'}
                    </Button>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Analysis & Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <Label htmlFor="why-trade">Entry Reason / Notes</Label>
                        <Textarea
                            id="why-trade"
                            placeholder="Why did you take this trade? What was your analysis?"
                            value={journalState.whyTrade}
                            onChange={(e) => setJournalState(prev => ({ ...prev, whyTrade: e.target.value }))}
                            rows={5}
                        />
                    </div>
                     <div>
                        <Label htmlFor="strategy">Strategy / Setup</Label>
                         <Select 
                            value={journalState.strategy} 
                            onValueChange={(value) => setJournalState(prev => ({...prev, strategy: value}))}
                        >
                            <SelectTrigger id="strategy">
                                <SelectValue placeholder="Select a strategy" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="breakout">Breakout</SelectItem>
                                <SelectItem value="breakdown">Breakdown</SelectItem>
                                <SelectItem value="reversal">Reversal</SelectItem>
                                <SelectItem value="trendline-reversal">Trendline Reversal</SelectItem>
                                <SelectItem value="trendline-break">Trendline Break</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                      <Label>Mistakes Made</Label>
                      <div className="space-y-2 pt-2">
                        {journalMistakes.map(mistake => (
                          <div key={mistake.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={mistake.id}
                              checked={journalState.mistakes.includes(mistake.id)}
                              onCheckedChange={(checked) => handleMistakeChange(mistake.id, !!checked)}
                            />
                            <Label htmlFor={mistake.id} className="font-normal">{mistake.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                        <Label htmlFor="what-next">What I'd Do Differently Next Time</Label>
                        <Textarea
                            id="what-next"
                            placeholder="Based on this trade, what will you improve?"
                            value={journalState.whatNext}
                            onChange={(e) => setJournalState(prev => ({ ...prev, whatNext: e.target.value }))}
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Rule Adherence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor="followed-risk">Did I follow risk per trade?</Label>
                         <Switch
                            id="followed-risk"
                            checked={journalState.followedRisk}
                            onCheckedChange={(checked) => setJournalState(prev => ({ ...prev, followedRisk: checked }))}
                         />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor="followed-daily-limit">Did I follow my daily trade limit?</Label>
                        <Switch
                           id="followed-daily-limit"
                           checked={journalState.followedDailyLimit}
                           onCheckedChange={(checked) => setJournalState(prev => ({ ...prev, followedDailyLimit: checked }))}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={handleUpdate}>{isExistingEntry ? 'Update Journal' : 'Add Journal'}</Button>
      </div>
    </div>
  );
}
