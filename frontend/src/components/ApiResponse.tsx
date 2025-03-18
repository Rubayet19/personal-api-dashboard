import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clipboard, Check } from 'lucide-react';

interface ApiResponseProps {
  response: {
    status_code: number;
    headers: Record<string, string>;
    body: any;
    time_taken: number;
  } | null;
}

export function ApiResponse({ response }: ApiResponseProps) {
  const [activeTab, setActiveTab] = useState<string>('body');
  const [copied, setCopied] = useState<boolean>(false);

  if (!response) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Response</CardTitle>
          <CardDescription>
            Send a request to see the response here
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-gray-500 py-8">
          No response yet. Use the request form above to make an API call.
        </CardContent>
      </Card>
    );
  }

  const getStatusVariant = (status: number) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'info';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'error';
    return 'default';
  };

  const formatJson = (data: any) => {
    try {
      if (typeof data === 'string') {
        // Try to parse as JSON if it's a string
        const jsonObj = JSON.parse(data);
        return JSON.stringify(jsonObj, null, 2);
      }
      return JSON.stringify(data, null, 2);
    } catch (e) {
      // If parsing fails, return as is (might be plain text)
      return data;
    }
  };

  const copyToClipboard = () => {
    const formattedJson = formatJson(response.body);
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Response
            <Badge variant={getStatusVariant(response.status_code)}>
              {response.status_code}
            </Badge>
            <span className="text-sm font-normal text-gray-500">
              {response.time_taken.toFixed(2)}ms
            </span>
          </CardTitle>
          <CardDescription>
            View the results of your API request
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="flex items-center gap-1"
        >
          {copied ? <Check size={16} /> : <Clipboard size={16} />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="body" className="mt-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="whitespace-pre-wrap overflow-auto max-h-[400px] text-sm font-mono">
                {formatJson(response.body)}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="headers" className="mt-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <table className="w-full">
                <thead className="text-left text-sm font-medium text-gray-500">
                  <tr>
                    <th className="pb-2">Header</th>
                    <th className="pb-2">Value</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <tr key={key} className="border-t border-gray-200">
                      <td className="py-2 font-mono">{key}</td>
                      <td className="py-2 font-mono">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 