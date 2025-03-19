import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useRequestBuilder } from '../contexts/use-request-builder';

// Define API key interface
interface ApiKey {
  id: string;
  api_name: string;
  api_key: string;
  created_at: string;
  updated_at: string;
}

// Define types for API request
interface ApiRequestPayload {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  api_key_id?: string;
}

export function ApiRequestForm() {
  const { state, setState } = useRequestBuilder();
  const {
    url,
    method,
    headers,
    body,
    activeTab,
    useApiKey,
    selectedApiKeyId
  } = state;
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableApiKeys, setAvailableApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState<boolean>(false);

  // Fetch available API keys on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      setIsLoadingKeys(true);
      try {
        // Our API directly returns the array of keys, not wrapped in a data property
        const keys = await api.get('/api/keys');
        console.log('API keys received:', keys);
        
        if (keys && Array.isArray(keys)) {
          setAvailableApiKeys(keys);
          console.log('Available API keys set:', keys.length);
          // If we have keys and no key is selected, set the first one as selected by default
          if (keys.length > 0 && useApiKey && !selectedApiKeyId) {
            setState({ selectedApiKeyId: keys[0].id });
          }
        } else {
          console.error('Unexpected API keys response format:', keys);
          setAvailableApiKeys([]);
        }
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
        setAvailableApiKeys([]);
      } finally {
        setIsLoadingKeys(false);
      }
    };
    
    fetchApiKeys();
  }, [useApiKey, selectedApiKeyId, setState]);

  const addHeader = () => {
    setState({ 
      headers: [...headers, { key: '', value: '', id: Date.now().toString() }]
    });
  };

  const removeHeader = (id: string) => {
    setState({
      headers: headers.filter(header => header.id !== id)
    });
  };

  const updateHeader = (id: string, field: 'key' | 'value', value: string) => {
    setState({
      headers: headers.map(header =>
        header.id === id ? { ...header, [field]: value } : header
      )
    });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Filter out empty headers
    const validHeaders = headers
      .filter(h => h.key.trim() !== '' && h.value.trim() !== '')
      .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {} as Record<string, string>);

    try {
      // Only include api_key_id if checkbox is checked AND a key is actually selected
      const requestData: ApiRequestPayload = {
        url,
        method,
        headers: validHeaders,
        body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
        api_key_id: useApiKey && selectedApiKeyId ? selectedApiKeyId : undefined
      };

      console.log('Sending request with data:', requestData);
      const response = await api.post('/api/proxy', requestData);
      
      // Store the response in the context
      setState({ response });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send request';
      setError(errorMessage);
      console.error('API request error:', error);
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
                onChange={(e) => setState({ url: e.target.value })}
                required
              />
            </div>
            <div className="w-full md:w-1/4">
              <Label htmlFor="method">Method</Label>
              <Select
                value={method}
                onValueChange={(value) => setState({ method: value })}
              >
                <SelectTrigger id="method">
                  <SelectValue placeholder="HTTP Method" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950">
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
              onChange={(e) => {
                setState({ useApiKey: e.target.checked });
                // If unchecking, clear the selected key
                if (!e.target.checked) {
                  setState({ selectedApiKeyId: '' });
                }
                // If checking and we have keys, select the first one by default
                else if (availableApiKeys && availableApiKeys.length > 0 && !selectedApiKeyId) {
                  setState({ selectedApiKeyId: availableApiKeys[0].id });
                }
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="useApiKey">Use stored API key</Label>
            
            {useApiKey && (
              <>
                {isLoadingKeys ? (
                  <div className="ml-2 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">Loading keys...</span>
                  </div>
                ) : availableApiKeys && availableApiKeys.length > 0 ? (
                  <div className="ml-2 flex-1">
                    <Select
                      value={selectedApiKeyId}
                      onValueChange={(value) => setState({ selectedApiKeyId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select API key" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-950">
                        {availableApiKeys.map((key) => (
                          <SelectItem key={key.id} value={key.id}>
                            {key.api_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedApiKeyId && (
                      <p className="text-xs text-gray-500 mt-1">
                        Your request will include credentials from the selected API key
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="ml-2 text-sm text-gray-500">
                    No API keys available. <a href="/dashboard/api-keys" className="text-blue-500 hover:underline">Add keys here</a>
                  </div>
                )}
              </>
            )}
          </div>

          <Tabs 
            value={activeTab} 
            onValueChange={(tab) => setState({ activeTab: tab })}
          >
            <TabsList>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body" disabled={method === 'GET' || method === 'HEAD'}>Body</TabsTrigger>
            </TabsList>
            
            <TabsContent value="headers" className="space-y-4 mt-4">
              {headers.map((header) => (
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
                onChange={(e) => setState({ body: e.target.value })}
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
      <CardFooter className="flex gap-4">
        <Button
          type="submit"
          disabled={!isFormValid || isLoading}
          onClick={handleSubmit}
          className="flex-1"
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
        
        <Button
          type="button"
          variant="outline"
          onClick={() => setState({
            url: '',
            method: 'GET',
            headers: [{ key: '', value: '', id: Date.now().toString() }],
            body: '',
            useApiKey: false,
            selectedApiKeyId: '',
            response: null,
            activeTab: 'headers'
          })}
          className="w-auto"
        >
          Clear Form
        </Button>
      </CardFooter>
    </Card>
  );
} 