import { useState } from "react";
import { Eye, EyeOff, Edit, Trash2, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiKey } from "../lib/api";

// Length threshold for considering an API key "large"
const LARGE_KEY_THRESHOLD = 40;

interface ApiKeyItemProps {
  apiKey: ApiKey;
  onEdit: (key: ApiKey) => void;
  onDelete: (id: string) => void;
  onViewDetail: (id: string) => void;
}

export function ApiKeyItem({ apiKey, onEdit, onDelete, onViewDetail }: ApiKeyItemProps) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLargeKey = (key: string) => key.length > LARGE_KEY_THRESHOLD;
  const maskedKey = apiKey.api_key.replace(/./g, "•");
  const displayKey = showKey ? apiKey.api_key : maskedKey;
  const truncatedKey = isLargeKey(apiKey.api_key) 
    ? (showKey ? `${apiKey.api_key.slice(0, 10)}...` : `${maskedKey.slice(0, 10)}...`) 
    : displayKey;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-md p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">{apiKey.api_name}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm font-mono text-gray-600">
              {isLargeKey(apiKey.api_key) ? (
                <span className="flex items-center">
                  {truncatedKey}
                  <button
                    onClick={() => onViewDetail(apiKey.id)}
                    className="text-blue-500 hover:text-blue-700 ml-1"
                    title="View full key"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                truncatedKey
              )}
            </span>
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-gray-500 hover:text-gray-700"
              title={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={copyToClipboard}
              className="text-gray-500 hover:text-gray-700"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(apiKey.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(apiKey)}
            title="Edit API key"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(apiKey.id)}
            title="Delete API key"
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 