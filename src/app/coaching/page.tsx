
'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/context/settings-context';
import { useTrades } from '@/context/trades-context';
import { useAnalytics } from '@/context/analytics-context';
import { generateCoachingResponse } from '@/ai/flows/generate-coaching-response';
import { generateSuggestedPrompts } from '@/ai/flows/generate-suggested-prompts';
import { Loader2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';


type Message = {
  sender: 'user' | 'ai';
  text: string;
};

const GeminiLogo = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.13296 9.867C5.55696 9.443 6.00096 9 6.60096 9C7.19996 9 7.64396 9.443 8.06796 9.867C8.49196 10.291 8.93596 10.709 8.93596 11.333C8.93596 11.957 8.49196 12.375 8.06796 12.799C7.64396 13.223 7.19996 13.666 6.60096 13.666C6.00096 13.666 5.55696 13.223 5.13296 12.799C4.70896 12.375 4.26496 11.957 4.26496 11.333C4.26496 10.709 4.70896 10.291 5.13296 9.867Z" fill="url(#paint0_linear_10_26)"/>
        <path d="M12.0001 5.33301C11.1001 5.33301 10.4001 6.03301 10.4001 6.93301C10.4001 7.83301 11.1001 8.53301 12.0001 8.53301C12.9001 8.53301 13.6001 7.83301 13.6001 6.93301C13.6001 6.03301 12.9001 5.33301 12.0001 5.33301Z" fill="#9333EA"/>
        <path d="M17.4001 9C16.8001 9 16.4001 9.40001 16.4001 10C16.4001 10.6 16.8001 11 17.4001 11C18.0001 11 18.4001 10.6 18.4001 10C18.4001 9.40001 18.0001 9 17.4001 9Z" fill="#FBBF24"/>
        <path d="M17.4001 13.667C16.5001 13.667 15.6001 14.281 15.6001 15.378C15.6001 16.475 16.5001 17.089 17.4001 17.089C18.3001 17.089 19.2001 16.475 19.2001 15.378C19.2001 14.281 18.3001 13.667 17.4001 13.667Z" fill="#F43F5E"/>
        <defs>
        <linearGradient id="paint0_linear_10_26" x1="4.26496" y1="11.333" x2="8.93596" y2="11.333" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6"/>
        <stop offset="1" stopColor="#1D4ED8"/>
        </linearGradient>
        </defs>
    </svg>
);

export default function CoachingPage() {
  const { settings } = useSettings();
  const { tradesData } = useTrades();
  const { analyticsSummary } = useAnalytics();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personalizedPrompts, setPersonalizedPrompts] = useState<string[]>([]);
  const [isPromptsLoading, setIsPromptsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const initialMessage = tradesData.length > 0
      ? "Hello! I'm your AI Trading Coach. I've analyzed your trades. How can I help you improve your performance today?"
      : "Hello! I'm your AI Trading Coach. It looks like you don't have any trades yet. Upload a trade history file or add a manual trade to get started.";
    setMessages([{ sender: 'ai', text: initialMessage }]);
  }, [tradesData.length]);


  const getTradingDataSummary = () => `
    Analytics: ${JSON.stringify(analyticsSummary)}.
    Recent Trades: ${JSON.stringify(
      tradesData
        .slice(0, 10)
        .map((t) => ({
          PnL: t.pl,
          symbol: t.symbol,
          side: t.side,
          journal: t.journal?.whyTrade || 'No journal entry.',
        }))
    )}.
  `;

  const getJournalEntriesSummary = () => tradesData
    .map((t) =>
      t.journal
        ? `Trade on ${t.date}: Notes - ${t.journal.whyTrade}, Mistakes - ${t.journal.mistakes.join(
            ', '
          )}, What to do next - ${t.journal.whatNext}`
        : ''
    )
    .filter(Boolean)
    .join('\n');

  useEffect(() => {
    const fetchPrompts = async () => {
      if (!tradesData.length) {
        setPersonalizedPrompts([
            'How do I import my trades?',
            'What stats can you show me?',
            'How do I add a manual trade?',
        ]);
        setIsPromptsLoading(false);
        return;
      }
      setIsPromptsLoading(true);
      try {
        const response = await generateSuggestedPrompts({
          tradingData: getTradingDataSummary(),
          journalEntries: getJournalEntriesSummary(),
        });
        setPersonalizedPrompts(response.prompts);
      } catch (error) {
        console.error('Error generating suggested prompts:', error);
        // Set fallback prompts on error
        setPersonalizedPrompts([
            'Why was my last trade a mistake?',
            'Analyze my tendency to overtrade.',
            'Suggest improvements for my risk management.',
        ]);
      } finally {
        setIsPromptsLoading(false);
      }
    };

    fetchPrompts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradesData, analyticsSummary]);

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, isLoading]);

  const getCoachingResponse = async (userMessage: string) => {
    setIsLoading(true);
    try {
      const response = await generateCoachingResponse({
        userQuery: userMessage,
        tradingData: getTradingDataSummary(),
        journalEntries: getJournalEntriesSummary(),
      });

      setMessages((prev) => [...prev, { sender: 'ai', text: response.response }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;
    const newUserMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, newUserMessage]);
    getCoachingResponse(input);
    setInput('');
  };

  const handlePromptClick = (prompt: string) => {
    const newUserMessage: Message = { sender: 'user', text: prompt };
    setMessages((prev) => [...prev, newUserMessage]);
    getCoachingResponse(prompt);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">AI Coaching</h1>
        <p className="text-muted-foreground">Ask questions and get real-time advice from your AI coach.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-2">
          <CardContent className="p-4 flex flex-col h-[600px] md:h-[550px]">
            <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
                <div className="space-y-4 p-4">
                    {messages.map((message, index) => (
                        <div
                        key={index}
                        className={`flex items-start gap-3 ${
                            message.sender === 'user' ? 'justify-end' : ''
                        }`}
                        >
                        {message.sender === 'ai' && (
                            <Avatar className="h-9 w-9 border flex-shrink-0 flex items-center justify-center">
                                <GeminiLogo />
                            </Avatar>
                        )}
                        <div
                            className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                            message.sender === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                        >
                            <ReactMarkdown className="prose prose-sm dark:prose-invert" components={{
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
                                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                            }}>
                                {message.text}
                            </ReactMarkdown>
                        </div>
                        {message.sender === 'user' && (
                            <Avatar className="h-9 w-9 border flex-shrink-0">
                            <AvatarImage src={settings.profile.avatarUrl} alt="User" />
                            <AvatarFallback>
                                {settings.profile.name?.[0]}
                            </AvatarFallback>
                            </Avatar>
                        )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 border flex-shrink-0 flex items-center justify-center">
                            <GeminiLogo />
                        </Avatar>
                        <div className="rounded-lg px-4 py-2 max-w-[75%] bg-muted flex items-center">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            
            <div className="mt-auto pt-4">
                <div className="relative">
                <Input
                    type="text"
                    placeholder="Ask your AI coach a question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    className="pr-12"
                    disabled={isLoading}
                />
                <Button
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={handleSendMessage}
                    disabled={isLoading}
                >
                    <Send className="h-4 w-4" />
                </Button>
                </div>
                 <p className="text-xs text-muted-foreground text-center mt-2">
                    Powered by googleai/gemini-2.5-flash
                </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Personalized Prompts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isPromptsLoading ? (
                        <>
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </>
                    ) : (
                        personalizedPrompts.map((prompt) => (
                            <button
                                key={prompt}
                                onClick={() => handlePromptClick(prompt)}
                                disabled={isLoading}
                                className="w-full text-left p-3 rounded-md bg-muted hover:bg-accent disabled:opacity-50 transition-colors text-sm text-muted-foreground"
                            >
                                "{prompt}"
                            </button>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
