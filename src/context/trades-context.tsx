
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Trade } from '@/lib/types';

const initialTradesData: Trade[] = [];

const DEFAULT_INITIAL_BALANCE = 10000;

// Helper to generate a simple unique ID
const generateUniqueId = () => `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getStoredData = (key: string, fallback: any) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    // Handle the case where "undefined" is stored as a string
    if (item === 'undefined' || item === null) {
        return fallback;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
};

const setStoredData = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  try {
    // Prevent storing 'undefined' by removing the key instead
    if (value === undefined) {
        window.localStorage.removeItem(key);
    } else {
        window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error)
    {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};


type TradesContextType = {
  tradesData: Trade[];
  setTradesData: (data: Trade[]) => void;
  addTrade: (trade: Omit<Trade, 'id'>) => void;
  updateTrade: (tradeId: string, updatedData: Partial<Trade>) => void;
  pendingTrades: Trade[];
  setPendingTrades: (data: Omit<Trade, 'id'>[]) => void;
  clearPendingTrades: () => void;
  resetAllData: () => void;
  initialBalance: number;
  setInitialBalance: (balance: number) => void;
  isLoading: boolean;
  selectedTradeForJournal: string | undefined;
  setSelectedTradeForJournal: (tradeId: string | undefined) => void;
};

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export const TradesProvider = ({ children }: { children: ReactNode }) => {
  const [tradesData, setTradesDataState] = useState<Trade[]>([]);
  const [pendingTrades, setPendingTradesState] = useState<Trade[]>([]);
  const [initialBalance, setInitialBalanceState] = useState(DEFAULT_INITIAL_BALANCE);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTradeForJournal, setSelectedTradeForJournal] = useState<string | undefined>();
  
  useEffect(() => {
    setTradesDataState(getStoredData('trades-data', initialTradesData));
    setInitialBalanceState(getStoredData('initial-balance', DEFAULT_INITIAL_BALANCE));
    // We do not load the selected trade from storage anymore to avoid stale state on page load.
    // It's a transient state managed by the app's navigation flow.
    setIsLoading(false);
  }, []);

  const setTradesData = useCallback((data: Trade[]) => {
    const dataWithIds = data.map(trade => {
        const hasDateClosed = 'dateClosed' in trade && trade.dateClosed;
        return {
            ...trade,
            id: trade.id || generateUniqueId(),
            dateClosed: hasDateClosed ? trade.dateClosed : trade.date,
        };
    });
    setStoredData('trades-data', dataWithIds);
    setTradesDataState(dataWithIds);
  }, []);
  
  const addTrade = useCallback((trade: Omit<Trade, 'id'>) => {
    const newTrade = { ...trade, id: generateUniqueId() };
    const updatedTrades = [newTrade, ...tradesData];
    setStoredData('trades-data', updatedTrades);
    setTradesDataState(updatedTrades);
  }, [tradesData]);

  const updateTrade = useCallback((tradeId: string, updatedData: Partial<Trade>) => {
    const updatedTrades = tradesData.map(trade => 
      trade.id === tradeId ? { ...trade, ...updatedData } : trade
    );
    setStoredData('trades-data', updatedTrades);
    setTradesDataState(updatedTrades);
  }, [tradesData]);

  const setPendingTrades = useCallback((data: Omit<Trade, 'id'>[]) => {
     const newPendingTrades = data.map(trade => {
        const hasDateClosed = 'dateClosed' in trade && trade.dateClosed;
        return {
            ...trade,
            id: generateUniqueId(),
            dateClosed: hasDateClosed ? trade.dateClosed! : trade.date,
        };
    });
    setPendingTradesState(newPendingTrades);
  }, []);

  const clearPendingTrades = useCallback(() => {
    setPendingTradesState([]);
  }, []);

  const setInitialBalance = useCallback((balance: number) => {
      setStoredData('initial-balance', balance);
      setInitialBalanceState(balance);
  }, []);

  const resetAllData = useCallback(() => {
    const emptyTrades: Trade[] = [];
    setTradesDataState(emptyTrades);
    setStoredData('trades-data', emptyTrades);
    setInitialBalanceState(DEFAULT_INITIAL_BALANCE);
    setStoredData('initial-balance', DEFAULT_INITIAL_BALANCE);
    setSelectedTradeForJournal(undefined);
    clearPendingTrades();
  }, [clearPendingTrades]);


  return (
    <TradesContext.Provider value={{ tradesData, setTradesData, addTrade, updateTrade, pendingTrades, setPendingTrades, clearPendingTrades, resetAllData, initialBalance, setInitialBalance, isLoading, selectedTradeForJournal, setSelectedTradeForJournal }}>
      {children}
    </TradesContext.Provider>
  );
};

export const useTrades = () => {
  const context = useContext(TradesContext);
  if (context === undefined) {
    throw new Error('useTrades must be used within a TradesProvider');
  }
  return context;
};
