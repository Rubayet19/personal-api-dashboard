import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { useRequestBuilder } from "../contexts/use-request-builder";

export function ApiResponse() {
  const { state } = useRequestBuilder();
  const { response } = state;

  if (!response) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Response</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            Send a request to see the response here
          </div>
        </CardContent>
      </Card>
    );
  }

  const { status_code, headers, body, time_taken } = response;
  
  // Format JSON for display
  const formattedBody = typeof body === 'object' 
    ? JSON.stringify(body, null, 2) 
    : String(body || '');
  
  // Determine badge color based on status code
  const getBadgeVariant = (status: number) => {
    if (status < 300) return "success";
    if (status < 400) return "warning";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>API Response</CardTitle>
        <div className="flex gap-2 items-center">
          <Badge variant={getBadgeVariant(status_code)}>
            {status_code}
          </Badge>
          <span className="text-sm text-gray-500">
            {time_taken ? `${time_taken.toFixed(2)}ms` : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="body">
          <TabsList>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="body" className="mt-4">
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96 text-sm font-mono">
              {formattedBody}
            </pre>
          </TabsContent>
          
          <TabsContent value="headers" className="mt-4">
            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 font-semibold">Header</th>
                    <th className="text-left py-2 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(headers).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-200">
                      <td className="py-2 font-mono">{key}</td>
                      <td className="py-2 font-mono break-all">{value}</td>
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