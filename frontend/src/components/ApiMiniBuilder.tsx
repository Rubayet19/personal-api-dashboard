import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../lib/hooks/use-toast';
import { ApiRequestHistory } from './ApiRequestHistory';
import { isAuthenticated } from '../lib/auth';

// Define response type for API proxy response
interface ProxyResponse {
  status_code: number;
  time_taken: number;
  headers: Record<string, string>;
  body: unknown;
}

export function ApiMiniBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [url, setUrl] = useState<string>('');
  const [method, setMethod] = useState<string>('GET');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGoToBuilder = () => {
    // Only store values in localStorage if user is authenticated
    if (isAuthenticated()) {
      // Store the initial values in localStorage to pre-populate the full builder
      const initialState = {
        url,
        method,
        headers: [{ key: '', value: '', id: Date.now().toString() }],
        body: '',
        useApiKey: false,
        selectedApiKeyId: '',
        response: null,
        activeTab: 'headers',
      };
      localStorage.setItem('requestBuilderState', JSON.stringify(initialState));
    }
    navigate('/dashboard/request-builder');
  };

  const handleQuickTest = async () => {
    if (!isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL to test",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/proxy', {
        url,
        method,
        headers: {},
        body: undefined
      }) as ProxyResponse;
      
      // Show success toast
      toast({
        title: `${response.status_code} ${method} Success`,
        description: `Request completed in ${response.time_taken.toFixed(2)}ms`,
        variant: "default"
      });
      
      // Only store in localStorage if user is authenticated
      if (isAuthenticated()) {
        // Navigate to the full builder with the results
        const initialState = {
          url,
          method,
          headers: [{ key: '', value: '', id: Date.now().toString() }],
          body: '',
          useApiKey: false,
          selectedApiKeyId: '',
          response: response,
          activeTab: 'headers',
        };
        localStorage.setItem('requestBuilderState', JSON.stringify(initialState));
      }
      navigate('/dashboard/request-builder');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to complete the request";
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false;
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isFormValid = url.trim() !== '' && isValidUrl(url);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-3/4">
            <Label htmlFor="mini-url">URL</Label>
            <Input
              id="mini-url"
              placeholder="https://api.example.com/endpoint"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="w-full md:w-1/4">
            <Label htmlFor="mini-method">Method</Label>
            <Select
              value={method}
              onValueChange={setMethod}
            >
              <SelectTrigger id="mini-method">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button 
            variant="default" 
            disabled={!isFormValid || isLoading}
            onClick={handleQuickTest}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Quick Test'
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleGoToBuilder}
            className="flex-1"
          >
            Full Request Builder
          </Button>
        </div>

        <div className="text-sm text-gray-500 mt-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Use Quick Test for simple GET requests</li>
            <li>Use Full Builder for advanced options (headers, body, API keys)</li>
            <li>All requests are securely proxied through our backend</li>
          </ul>
        </div>
      </div>
      
      {/* Request History */}
      <div className="mt-8">
        <ApiRequestHistory />
      </div>
    </div>
  );
} 