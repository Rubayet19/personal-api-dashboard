import { useState, useEffect, useCallback } from 'react';
import { api, type RequestLog } from '../lib/api';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../lib/hooks/use-toast';

// Define badge variant types
type MethodBadgeVariant = 'default' | 'outline' | 'secondary' | 'destructive' | 'warning';
type StatusBadgeVariant = 'success' | 'warning' | 'destructive' | 'default';

export function ApiRequestHistory() {
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequestLogs = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const logs = await api.getRequestLogs();
      setRequestLogs(logs);
    } catch (err) {
      console.error('Failed to fetch request logs:', err);
      setError('Failed to load request history');
      toast({
        title: 'Error',
        description: 'Failed to load request history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequestLogs();
  }, [fetchRequestLogs]);

  // Format the timestamp to a readable format
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get badge color based on status code
  const getStatusBadgeVariant = (statusCode: number): StatusBadgeVariant => {
    if (statusCode < 300) return 'success';
    if (statusCode < 400) return 'warning';
    return 'destructive';
  };

  // Get badge text for HTTP methods
  const getMethodBadge = (method: string): MethodBadgeVariant => {
    const variants: Record<string, MethodBadgeVariant> = {
      GET: 'default',
      POST: 'outline',
      PUT: 'secondary',
      DELETE: 'destructive',
      PATCH: 'warning',
    };
    return variants[method] || 'default';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Request History</CardTitle>
          <button
            onClick={fetchRequestLogs}
            className="text-xs text-blue-600 hover:text-blue-800"
            disabled={isLoading}
            aria-label="Refresh request history"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-500 mb-3" role="alert">{error}</div>
        )}

        {isLoading ? (
          <div className="space-y-2" aria-label="Loading request history">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : requestLogs.length === 0 ? (
          <div className="text-center py-6 text-gray-500" aria-label="No request history">
            <p className="mb-2">No request history available</p>
            <p className="text-sm">Test an API endpoint to see your request history</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {requestLogs.map((log, index) => (
              <div key={index} className="border rounded-md p-3 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex space-x-2 items-center">
                    <Badge variant={getMethodBadge(log.method)}>
                      {log.method}
                    </Badge>
                    <Badge 
                      variant={getStatusBadgeVariant(log.status_code)}
                    >
                      {log.status_code}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                <div className="text-sm truncate text-gray-700" title={log.url}>
                  {log.url}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Time: {log.time_taken.toFixed(2)}ms
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 