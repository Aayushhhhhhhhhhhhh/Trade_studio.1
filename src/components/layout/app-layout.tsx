
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart2,
  Settings,
  Upload,
  User,
  Home,
  Briefcase,
  LineChart,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTrades } from '@/context/trades-context';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import type { Trade } from '@/lib/types';
import { format, parse } from 'date-fns';
import { ThemeToggle } from '@/components/layout/theme-toggle';

type AppLayoutProps = {
  children: React.ReactNode;
};

function HeaderContent() {
    const { isMobile } = useSidebar();
    const router = useRouter();
    const { setPendingTrades } = useTrades();
    const { toast } = useToast();

    const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || !target.files[0]) return;

      const file = target.files[0];
      
      const findHeaderRow = (data: any[][]) => {
          const keywords = ['time', 'price', 'type', 'volume', 'profit', 'symbol', 's/l', 't/p', 'commission', 'swap', 'p/l'];
          let bestMatchIndex = -1;
          let maxMatches = 0;

          for (let i = 0; i < Math.min(data.length, 10); i++) {
              const row = data[i];
              if (!Array.isArray(row)) continue;

              const lowerCaseRow = row.map(cell => String(cell).toLowerCase());
              const matches = lowerCaseRow.filter(cell => keywords.some(kw => cell.includes(kw))).length;

              if (matches > maxMatches) {
                  maxMatches = matches;
                  bestMatchIndex = i;
              }
          }
          return bestMatchIndex;
      };

      const processAndValidateData = (data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) {
           toast({
            variant: 'destructive',
            title: 'Invalid File Format',
            description: "The file appears to be empty or in an unsupported format.",
          });
          return;
        }
        
        let dataAsArray = Array.isArray(data[0]) ? data as any[][] : data.map(obj => Object.values(obj));

        const headerRowIndex = findHeaderRow(dataAsArray);

        if (headerRowIndex === -1) {
            toast({
                variant: 'destructive',
                title: 'Invalid File Format',
                description: "Could not find a valid header row. Please ensure the file contains columns like 'Time', 'Price', 'Symbol', etc.",
            });
            return;
        }
        
        const normalizeHeader = (h: any) => String(h).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
        const headerRowRaw = dataAsArray[headerRowIndex];
        
        const headerIndex: {[key: string]: number[]} = {};
        headerRowRaw.forEach((h, i) => {
            const normalized = normalizeHeader(h);
            if (!headerIndex[normalized]) {
                headerIndex[normalized] = [];
            }
            headerIndex[normalized].push(i);
        });

        const firstOf = (idx: typeof headerIndex, aliases: string[]): number | undefined => {
            for (const alias of aliases) {
                if (idx[alias]?.[0] !== undefined) {
                    return idx[alias][0];
                }
            }
            return undefined;
        };
        
        const fieldIndexMap: { [appField: string]: number | undefined } = {
          date: headerIndex['time']?.[0],
          dateClosed: headerIndex['time']?.[1],
          entry: headerIndex['price']?.[0],
          exit: headerIndex['price']?.[1],
          symbol: firstOf(headerIndex, ['symbol', 'instrument']),
          side: firstOf(headerIndex, ['type', 'side', 'buy sell']),
          size: firstOf(headerIndex, ['volume', 'size', 'lots']),
          pl: firstOf(headerIndex, ['pl', 'p l', 'profit', 'net profit']),
          sl: firstOf(headerIndex, ['s l', 'sl']),
          tp: firstOf(headerIndex, ['t p', 'tp']),
          commission: firstOf(headerIndex, ['commission']),
          swap: firstOf(headerIndex, ['swap']),
        };

        const requiredAppFields = ['date', 'symbol', 'side', 'size', 'entry', 'exit'];
        const hasAllRequired = requiredAppFields.every(field => fieldIndexMap[field] !== undefined);

        if (!hasAllRequired) {
          const missing = requiredAppFields.filter(f => fieldIndexMap[f] === undefined);
          toast({
            variant: 'destructive',
            title: 'Mapping Failed',
            description: `Could not find required columns: ${missing.join(', ')}. Please check your file.`,
             duration: 9000,
          });
          return;
        }
        
        const remappedJsonData = dataAsArray.slice(headerRowIndex + 1).map(row => {
            const newRow: { [key: string]: any } = {};
            for (const appField in fieldIndexMap) {
                const index = fieldIndexMap[appField as keyof typeof fieldIndexMap];
                if (index !== undefined) {
                     newRow[appField] = row[index];
                }
            }
            return newRow;
        });

        const cleanAndParseFloat = (value: any): number => {
            if (typeof value === 'string') {
                const cleaned = value.replace(/[^0-9.-]+/g,"");
                return parseFloat(cleaned);
            }
            if (typeof value === 'number') {
                return value;
            }
            return NaN;
        }

        const parseDateTime = (dateString: any): Date | null => {
            if (!dateString) return null;

            if (typeof dateString === 'number') {
                 // Handle Excel serial date number
                const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                const excelDate = new Date(excelEpoch.getTime() + dateString * 24 * 60 * 60 * 1000);
                if (!isNaN(excelDate.getTime())) return excelDate;
            }

            const str = String(dateString).trim();
            // Try parsing different common formats. More specific ones first.
            const formats = [
                "yyyy.MM.dd HH:mm:ss",
                "yyyy.MM.dd HH:mm",
                "dd.MM.yyyy HH:mm:ss",
                "dd.MM.yyyy HH:mm",
                "MM/dd/yyyy HH:mm:ss",
                "MM/dd/yyyy HH:mm",
                "yyyy-MM-dd HH:mm:ss",
                "yyyy-MM-dd HH:mm",
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ss",
                "yyyy-MM-dd",
            ];
            
            for (const fmt of formats) {
                try {
                    const parsed = parse(str, fmt, new Date());
                    if (!isNaN(parsed.getTime())) return parsed;
                } catch (e) {
                    // ignore and try next format
                }
            }
            
            // Fallback for simple date strings or ISO strings
            const d = new Date(str);
            return isNaN(d.getTime()) ? null : d;
        };
        
        const validTrades = remappedJsonData.map(t => {
            const side = String(t.side).toLowerCase().includes('buy') ? 'Buy' : 'Sell';
            const entry = cleanAndParseFloat(t.entry);
            const exit = cleanAndParseFloat(t.exit);
            const size = cleanAndParseFloat(t.size);
            const commission = t.commission ? cleanAndParseFloat(t.commission) : 0;
            const swap = t.swap ? cleanAndParseFloat(t.swap) : 0;
            
            let pl = 0;
            if (t.pl !== undefined) {
                pl = cleanAndParseFloat(t.pl);
            } else if (!isNaN(entry) && !isNaN(exit) && !isNaN(size)) {
                if (side === 'Buy') {
                    pl = (exit - entry) * size;
                } else { // Sell
                    pl = (entry - exit) * size;
                }
            }
            
            const parsedDate = parseDateTime(t.date);
            if (!parsedDate) return null;
            
            const parsedDateClosed = t.dateClosed ? parseDateTime(t.dateClosed) : parsedDate;

            return {
                date: parsedDate.toISOString(),
                dateClosed: parsedDateClosed!.toISOString(),
                symbol: String(t.symbol),
                side: side,
                size: size,
                entry: entry,
                exit: exit,
                pl: pl,
                commission: commission,
                swap: swap,
                sl: t.sl ? cleanAndParseFloat(t.sl) : undefined,
            }
        }).filter(t => 
          t && t.date && t.symbol && t.side && !isNaN(t.size) && !isNaN(t.entry) && !isNaN(t.exit) && !isNaN(t.pl) && t.dateClosed
        ) as Omit<Trade, 'id'>[];


        if (validTrades.length === 0) {
             toast({
                variant: 'destructive',
                title: 'No Valid Trades Found',
                description: 'The file was parsed, but no valid trade rows could be extracted. Please check the data.',
            });
            return;
        }

        setPendingTrades(validTrades);
        router.push('/trades/import');
      }

      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: false,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length) {
              toast({
                variant: 'destructive',
                title: 'Error parsing CSV',
                description: results.errors.map(e => e.message).join(', '),
              });
              return;
            }
            processAndValidateData(results.data as any[]);
          },
          error: (error) => {
            toast({
              variant: 'destructive',
              title: 'Error parsing CSV',
              description: error.message,
            });
          }
        });
      } else if (file.name.endsWith('.xlsx')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            processAndValidateData(jsonData);
          } catch (error: any) {
            toast({
              variant: 'destructive',
              title: 'Error parsing XLSX',
              description: error.message,
            });
          }
        };
        reader.onerror = () => {
          toast({
            variant: 'destructive',
            title: 'Error reading file',
            description: 'Could not read the selected file.',
          });
        }
        reader.readAsArrayBuffer(file);
      } else {
        toast({
          variant: 'destructive',
          title: 'Unsupported file type',
          description: 'Please upload a .csv or .xlsx file.',
        });
      }
    };
    input.click();
  };
    return (
        <header className="flex h-16 items-center justify-between border-b bg-background/50 backdrop-blur-sm px-4 sticky top-0 z-10">
            <div className="flex items-center gap-2">
                <SidebarTrigger />
                <div className="hidden sm:flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">TradeWise</h1>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <Button onClick={handleImportClick} size="sm" className="text-xs sm:text-sm">
                  <Upload className="mr-2 h-4 w-4" /> 
                  <span className="hidden sm:inline">Upload File</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
                <Button asChild variant="outline" size="sm" className="text-xs sm:text-sm">
                  <Link href="/trades/new">New Trade</Link>
                </Button>
                <ThemeToggle />
            </div>
        </header>
    )
}

function SidebarNav() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenu className="flex-1 p-2 space-y-1">
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard')} tooltip="Dashboard" onClick={handleLinkClick}>
          <Link href="/dashboard">
            <Home />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/trades')} tooltip="Trades" onClick={handleLinkClick}>
          <Link href="/trades">
            <Briefcase />
            <span>Trades</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/calendar')} tooltip="Calendar" onClick={handleLinkClick}>
          <Link href="/calendar">
            <Calendar />
            <span>Calendar</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/journal')} tooltip="Journal" onClick={handleLinkClick}>
          <Link href="/journal">
            <BookOpen />
            <span>Journal</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/analytics')} tooltip="Analytics" onClick={handleLinkClick}>
          <Link href="/analytics">
            <LineChart />
            <span>Analytics</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/coaching')} tooltip="Coaching" onClick={handleLinkClick}>
          <Link href="/coaching">
            <TrendingUp />
            <span>Coaching</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')} tooltip="Settings" onClick={handleLinkClick}>
          <Link href="/settings">
            <Settings />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}


export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center gap-3">
             <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                <TrendingUp className="h-6 w-6 text-primary" />
                <p className="font-semibold text-card-foreground">
                    TradeWise
                </p>
             </div>
          </div>
          <SidebarNav />
          <div className="mt-auto p-4 flex flex-col gap-4 group-data-[collapsible=icon]:hidden">
            <Button>Upgrade</Button>
            <Separator />
            <div className="flex flex-col space-y-2 text-sm">
              <Link href="#" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <HelpCircle className="h-4 w-4" /> Help and Docs
              </Link>
            </div>
          </div>
        </div>
      </Sidebar>
      <SidebarInset>
        <HeaderContent />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
