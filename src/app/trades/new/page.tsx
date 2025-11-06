
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTrades } from '@/context/trades-context';
import { useRouter } from 'next/navigation';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';

const newTradeFormSchema = z.object({
  symbol: z.string().min(1, { message: 'Symbol is required.' }),
  side: z.enum(['Buy', 'Sell']),
  size: z.coerce.number().positive({ message: 'Size must be positive.' }),
  entry: z.coerce.number().positive({ message: 'Entry price must be positive.' }),
  exit: z.coerce.number().positive({ message: 'Exit price must be positive.' }),
  dateOpened: z.date({ required_error: 'An open date is required.' }),
  timeOpened: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Use HH:mm"}),
  dateClosed: z.date({ required_error: 'A close date is required.' }),
  timeClosed: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Use HH:mm"}),
  pl: z.number().optional(),
  rMultiple: z.number().optional(),
  sl: z.coerce.number().optional(),
});

type NewTradeFormValues = z.infer<typeof newTradeFormSchema>;

export default function NewTradePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { addTrade } = useTrades();

  const form = useForm<NewTradeFormValues>({
    resolver: zodResolver(newTradeFormSchema),
    defaultValues: {
      symbol: '',
      side: 'Buy',
      size: 0,
      entry: 0,
      exit: 0,
      sl: 0,
      pl: 0,
      rMultiple: 0,
      dateOpened: new Date(),
      timeOpened: format(new Date(), 'HH:mm'),
      dateClosed: new Date(),
      timeClosed: format(new Date(), 'HH:mm'),
    },
  });

  const { watch, setValue } = form;
  const side = watch('side');
  const entryPrice = watch('entry');
  const exitPrice = watch('exit');
  const size = watch('size');
  const sl = watch('sl');

  useEffect(() => {
    if (entryPrice && exitPrice && size) {
      let pl;
      if (side === 'Buy') {
        pl = (exitPrice - entryPrice) * size;
      } else { // Sell
        pl = (entryPrice - exitPrice) * size;
      }
      setValue('pl', pl);

      if (sl) {
        const risk = side === 'Buy' ? (entryPrice - sl) * size : (sl - entryPrice) * size;
        if (risk > 0) {
          const rMultiple = pl / risk;
          setValue('rMultiple', isFinite(rMultiple) ? rMultiple : 0);
        } else {
            setValue('rMultiple', 0);
        }
      } else {
        setValue('rMultiple', undefined);
      }

    } else {
        setValue('pl', undefined);
        setValue('rMultiple', undefined);
    }
  }, [entryPrice, exitPrice, size, side, sl, setValue]);

  function onSubmit(data: NewTradeFormValues) {
    const [openHours, openMinutes] = data.timeOpened.split(':').map(Number);
    const dateOpened = new Date(data.dateOpened);
    dateOpened.setHours(openHours, openMinutes);

    const [closeHours, closeMinutes] = data.timeClosed.split(':').map(Number);
    const dateClosed = new Date(data.dateClosed);
    dateClosed.setHours(closeHours, closeMinutes);

    const newTrade = {
      date: dateOpened.toISOString(),
      dateClosed: dateClosed.toISOString(),
      symbol: data.symbol.toUpperCase(),
      side: data.side,
      size: data.size,
      entry: data.entry,
      exit: data.exit,
      pl: data.pl ?? 0,
      rMultiple: data.rMultiple,
      sl: data.sl,
    };

    addTrade(newTrade);

    toast({
      title: 'Trade Saved',
      description: `New ${data.symbol} trade has been added to your journal.`,
    });
    router.push('/trades');
  }

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold">New Trade Entry</h1>
        <Card>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Symbol</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., AAPL" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="side"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="Buy">Buy</TabsTrigger>
                                            <TabsTrigger value="Sell">Sell</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="size"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Size</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 100" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="entry"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Entry Price</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 150.25" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sl"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Stop Loss (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 148.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="exit"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Exit Price</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 155.50" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="dateOpened"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Date Opened</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={'outline'}
                                            className={cn(
                                                'pl-3 text-left font-normal',
                                                !field.value && 'text-muted-foreground'
                                            )}
                                            >
                                            {field.value ? (
                                                format(field.value, 'PPP')
                                            ) : (
                                                <span>Select Date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                            date > new Date() || date < new Date('1900-01-01')
                                            }
                                            initialFocus
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="timeOpened"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Time Opened</FormLabel>
                                    <FormControl>
                                      <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="dateClosed"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Date Closed</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={'outline'}
                                            className={cn(
                                                'pl-3 text-left font-normal',
                                                !field.value && 'text-muted-foreground'
                                            )}
                                            >
                                            {field.value ? (
                                                format(field.value, 'PPP')
                                            ) : (
                                                <span>Select Date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                            date > new Date() || date < new Date('1900-01-01')
                                            }
                                            initialFocus
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="timeClosed"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Time Closed</FormLabel>
                                    <FormControl>
                                      <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                        </div>
                        
                         <FormField
                            control={form.control}
                            name="pl"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>P/L (Auto-calculated)</FormLabel>
                                <FormControl>
                                    <Input readOnly disabled {...field} value={field.value !== undefined ? field.value.toFixed(2) : ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                         <FormField
                            control={form.control}
                            name="rMultiple"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>R-Multiple (Auto-calculated)</FormLabel>
                                <FormControl>
                                     <Input readOnly disabled {...field} value={field.value !== undefined ? field.value.toFixed(2) : ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end">
                            <Button type="submit">Save Trade</Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}
