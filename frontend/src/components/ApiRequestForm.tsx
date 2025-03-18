import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { api } from '../lib/api';

interface Header {
  key: string;
  value: string;
  id: string;
}

interface ApiRequestFormProps {
  onResponseReceived?: (response: any) => void;
}

export function ApiRequestForm({ onResponseReceived }: ApiRequestFormProps) {
  const [url, setUrl] = useState<string>('');
  const [method, setMethod] = useState<string>('GET');
  const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '', id: Date.now().toString() }]);
  const [body, setBody] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('headers');
  const [useApiKey, setUseApiKey] = useState<boolean>(false);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>('');
  const [availableApiKeys, setAvailableApiKeys] = useState<any[]>([]);

  // Fetch available API keys on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const response = await api.get('/api/keys');
        setAvailableApiKeys(response.data);
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
      }
    };
    
    fetchApiKeys();
  }, []);

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', id: Date.now().toString() }]);
  };

  const removeHeader = (id: string) => {
    setHeaders(headers.filter(header => header.id !== id));
  };

  const updateHeader = (id: string, field: 'key' | 'value', value: string) => {
    setHeaders(
      headers.map(header =>
        header.id === id ? { ...header, [field]: value } : header
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Filter out empty headers
    const validHeaders = headers
      .filter(h => h.key.trim() !== '' && h.value.trim() !== '')
      .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

    try {
      const requestData = {
        url,
        method,
        headers: validHeaders,
        body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
        api_key_id: useApiKey ? selectedApiKeyId : undefined
      };

      const response = await api.post('/api/proxy', requestData);
      
      if (onResponseReceived) {
        onResponseReceived(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send request');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const isFormValid = url.trim() !== '' && isValidUrl(url);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Request Builder</CardTitle>
        <CardDescription>
          Create and send API requests to any endpoint
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-3/4">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="https://api.example.com/endpoint"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <div className="w-full md:w-1/4">
              <Label htmlFor="method">Method</Label>
              <Select
                value={method}
                onValueChange={(value) => setMethod(value)}
              >
                <SelectTrigger id="method">
                  <SelectValue placeholder="HTTP Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="useApiKey"
              checked={useApiKey}
              onChange={(e) => setUseApiKey(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="useApiKey">Use stored API key</Label>
            
            {useApiKey && (
              <Select
                value={selectedApiKeyId}
                onValueChange={(value) => setSelectedApiKeyId(value)}
                disabled={availableApiKeys.length === 0}
              >
                <SelectTrigger className="ml-2">
                  <SelectValue placeholder="Select API key" />
                </SelectTrigger>
                <SelectContent>
                  {availableApiKeys.map((key) => (
                    <SelectItem key={key.id} value={key.id}>
                      {key.api_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body" disabled={method === 'GET' || method === 'HEAD'}>Body</TabsTrigger>
            </TabsList>
            
            <TabsContent value="headers" className="space-y-4 mt-4">
              {headers.map((header, index) => (
                <div key={header.id} className="flex gap-2 items-start">
                  <Input
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeHeader(header.id)}
                    className="mt-1"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addHeader}
                className="w-full"
              >
                Add Header
              </Button>
            </TabsContent>
            
            <TabsContent value="body" className="space-y-4 mt-4">
              <Textarea
                placeholder="Request body (JSON, form data, etc.)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[200px] font-mono"
              />
            </TabsContent>
          </Tabs>

          {error && (
            <div className="bg-red-100 p-3 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          disabled={!isFormValid || isLoading}
          onClick={handleSubmit}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Request...
            </>
          ) : (
            'Send Request'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 