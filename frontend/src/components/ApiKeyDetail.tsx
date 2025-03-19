import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ApiKey } from "../lib/api";

interface ApiKeyDetailProps {
  apiKey: ApiKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDetail({ apiKey, open, onOpenChange }: ApiKeyDetailProps) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!apiKey) return null;

  const maskedKey = apiKey.api_key.replace(/./g, "•");
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Key Details</DialogTitle>
          <DialogDescription>
            Full details for API key: {apiKey.api_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <h3 className="text-sm font-medium">API Name</h3>
            <p className="mt-1">{apiKey.api_name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">API Key</h3>
            <div className="flex items-center mt-1">
              <code className="font-mono text-sm bg-gray-100 p-2 rounded flex-1 overflow-x-auto">
                {showKey ? apiKey.api_key : maskedKey}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="ml-2"
                title={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="ml-1"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium">Created</h3>
            <p className="mt-1">
              {new Date(apiKey.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium">ID</h3>
            <p className="mt-1 font-mono text-sm text-gray-500">
              {apiKey.id}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 