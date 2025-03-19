import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiKeyItem } from "./ApiKeyItem";
import { ApiKey } from "../lib/api";

interface ApiKeyListProps {
  apiKeys: ApiKey[];
  isLoading: boolean;
  onAddNew: () => void;
  onEdit: (key: ApiKey) => void;
  onDelete: (id: string) => void;
  onViewDetail: (id: string) => void;
}

export function ApiKeyList({
  apiKeys,
  isLoading,
  onAddNew,
  onEdit,
  onDelete,
  onViewDetail,
}: ApiKeyListProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-6 bg-gray-200 w-3/4 max-w-md rounded mb-4"></div>
          <div className="h-20 bg-gray-200 w-full max-w-lg rounded"></div>
        </div>
      </div>
    );
  }

  if (apiKeys.length === 0) {
    return (
      <div className="py-8 text-center">
        <h3 className="text-lg font-medium text-gray-600 mb-4">
          No API keys found
        </h3>
        <p className="text-gray-500 mb-6">
          You haven't added any API keys yet. Add your first key to get started.
        </p>
        <Button onClick={onAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add New API Key
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your API Keys</h2>
        <Button onClick={onAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Key
        </Button>
      </div>
      <div className="mt-4">
        {apiKeys.map((apiKey) => (
          <ApiKeyItem
            key={apiKey.id}
            apiKey={apiKey}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDetail={onViewDetail}
          />
        ))}
      </div>
    </div>
  );
} 