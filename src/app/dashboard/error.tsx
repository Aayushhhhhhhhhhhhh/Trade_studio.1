'use client';

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/20 p-3 rounded-full">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-2xl">Dashboard Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Sorry, something went wrong while loading the dashboard.
          </p>
          {error?.message && (
             <pre className="mt-4 text-left bg-muted p-3 rounded-md text-xs font-code overflow-x-auto">
                <code>{error.message}</code>
             </pre>
          )}
          <Button onClick={() => reset()} className="mt-6">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
