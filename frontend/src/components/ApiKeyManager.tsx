import { useState, useEffect } from "react";
import { getApiKeys, createApiKey, updateApiKey, deleteApiKey, ApiKey } from "../lib/api";
import { ApiKeyForm } from "./ApiKeyForm";
import { ApiKeyList } from "./ApiKeyList";
import { ApiKeyDetail } from "./ApiKeyDetail";
import { ApiKeyDeleteDialog } from "./ApiKeyDeleteDialog";

export function ApiKeyManager() {
  // State for API keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [viewDetailDialogOpen, setViewDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch API keys on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const keys = await getApiKeys();
        setApiKeys(keys);
      } catch (err) {
        setError("Failed to load API keys");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  // Add a new API key
  const handleAddKey = async (data: { api_name: string; api_key: string }) => {
    try {
      setError(null);
      const newKey = await createApiKey({
        api_name: data.api_name,
        api_key: data.api_key,
      });

      setApiKeys((prev) => [...prev, newKey]);
      setIsAddingKey(false);
      return true;
    } catch (err) {
      setError("Failed to add API key");
      console.error(err);
      return false;
    }
  };

  // Edit an existing API key
  const handleEditKey = async (data: { api_name: string; api_key: string }) => {
    if (!selectedKey) return false;

    try {
      setError(null);
      const updatedKey = await updateApiKey(selectedKey.id, {
        api_name: data.api_name,
        api_key: data.api_key,
      });

      setApiKeys((prev) =>
        prev.map((key) => (key.id === selectedKey.id ? updatedKey : key))
      );
      setSelectedKey(null);
      return true;
    } catch (err) {
      setError("Failed to update API key");
      console.error(err);
      return false;
    }
  };

  // Start editing a key
  const handleStartEdit = (key: ApiKey) => {
    setSelectedKey(key);
  };

  // Delete an API key
  const handleDeleteKey = async () => {
    if (!selectedKey) return;

    try {
      setIsDeleting(true);
      setError(null);
      await deleteApiKey(selectedKey.id);
      setApiKeys((prev) => prev.filter((key) => key.id !== selectedKey.id));
      setDeleteDialogOpen(false);
      setSelectedKey(null);
    } catch (err) {
      setError("Failed to delete API key");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete confirmation dialog
  const confirmDelete = (id: string) => {
    const keyToDelete = apiKeys.find(key => key.id === id);
    if (keyToDelete) {
      setSelectedKey(keyToDelete);
      setDeleteDialogOpen(true);
    }
  };

  // View key details
  const handleViewKeyDetail = (id: string) => {
    const keyToView = apiKeys.find(key => key.id === id);
    if (keyToView) {
      setSelectedKey(keyToView);
      setViewDetailDialogOpen(true);
    }
  };

  // Cancel form actions
  const handleCancel = () => {
    setIsAddingKey(false);
    setSelectedKey(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAddingKey || selectedKey) && !deleteDialogOpen && !viewDetailDialogOpen ? (
        <ApiKeyForm 
          apiKey={selectedKey}
          onSubmit={selectedKey ? handleEditKey : handleAddKey}
          onCancel={handleCancel}
        />
      ) : (
        <ApiKeyList
          apiKeys={apiKeys}
          isLoading={isLoading}
          onAddNew={() => setIsAddingKey(true)}
          onEdit={handleStartEdit}
          onDelete={confirmDelete}
          onViewDetail={handleViewKeyDetail}
        />
      )}

      {/* API Key Detail Dialog */}
      <ApiKeyDetail
        apiKey={selectedKey}
        open={viewDetailDialogOpen}
        onOpenChange={setViewDetailDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <ApiKeyDeleteDialog
        apiKeyName={selectedKey?.api_name || ""}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteKey}
        isDeleting={isDeleting}
      />
    </div>
  );
} 