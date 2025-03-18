import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Edit, Trash2, Key, Plus, Loader2, ExternalLink, Copy, Check } from "lucide-react";
import { getApiKeys, createApiKey, updateApiKey, deleteApiKey, ApiKey } from "../lib/api";

// Define API key schema for validation
const apiKeySchema = z.object({
  api_name: z.string().min(1, "API name is required"),
  api_key: z.string().min(1, "API key is required"),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

// Length threshold for considering an API key "large"
const LARGE_KEY_THRESHOLD = 40;

export function ApiKeyManager() {
  // State for API keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [viewingKeyDetail, setViewingKeyDetail] = useState<string | null>(null);
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      api_name: "",
      api_key: "",
    },
  });

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

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copiedKey) {
      const timer = setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedKey]);

  // Check if key is too large to show in table view
  const isLargeKey = (key: string) => key.length > LARGE_KEY_THRESHOLD;

  // Toggle API key visibility
  const toggleKeyVisibility = (id: string) => {
    const key = apiKeys.find(k => k.id === id);
    if (key && isLargeKey(key.api_key)) {
      // For large keys, open the detail view instead
      setViewingKeyDetail(id);
    } else {
      setShowApiKey((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    }
  };

  // Copy API key to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
  };

  // Add a new API key
  const handleAddKey = async (data: ApiKeyFormValues) => {
    try {
      setError(null);
      const newKey = await createApiKey({
        api_name: data.api_name,
        api_key: data.api_key,
      });

      setApiKeys((prev) => [...prev, newKey]);
      setIsAddingKey(false);
      reset();
    } catch (err) {
      setError("Failed to add API key");
      console.error(err);
    }
  };

  // Edit an existing API key
  const handleEditKey = async (data: ApiKeyFormValues) => {
    if (!editingKey) return;

    try {
      setError(null);
      const updatedKey = await updateApiKey(editingKey, {
        api_name: data.api_name,
        api_key: data.api_key,
      });

      setApiKeys((prev) =>
        prev.map((key) => (key.id === editingKey ? updatedKey : key))
      );
      setEditingKey(null);
      reset();
    } catch (err) {
      setError("Failed to update API key");
      console.error(err);
    }
  };

  // Start editing a key
  const startEditKey = (key: ApiKey) => {
    setEditingKey(key.id);
    reset({ api_name: key.api_name, api_key: key.api_key });
  };

  // Delete an API key
  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      setError(null);
      await deleteApiKey(id);
      setApiKeys((prev) => prev.filter((key) => key.id !== id));
      
      // Close detail view if deleted key was being viewed
      if (viewingKeyDetail === id) {
        setViewingKeyDetail(null);
      }
    } catch (err) {
      setError("Failed to delete API key");
      console.error(err);
    }
  };

  // Cancel adding or editing
  const handleCancel = () => {
    setIsAddingKey(false);
    setEditingKey(null);
    reset();
  };

  // Render the API key detail view
  const renderKeyDetailView = () => {
    if (!viewingKeyDetail) return null;
    
    const key = apiKeys.find(k => k.id === viewingKeyDetail);
    if (!key) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
          <div className="flex justify-between items-center border-b p-4">
            <h3 className="text-lg font-medium text-gray-900">API Key Details</h3>
            <button 
              onClick={() => setViewingKeyDetail(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              &times;
            </button>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-500 mb-1">API Name</div>
              <div className="text-gray-900">{key.api_name}</div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-500 mb-1">API Key</div>
                <button
                  onClick={() => copyToClipboard(key.api_key, key.id)}
                  className="text-gray-400 hover:text-gray-600 inline-flex items-center text-xs"
                >
                  {copiedKey === key.id ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-sm break-all">
                {key.api_key}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Created At</div>
              <div className="text-gray-900">{new Date(key.created_at).toLocaleString()}</div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Last Updated</div>
              <div className="text-gray-900">{new Date(key.updated_at).toLocaleString()}</div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-3">
            <button
              onClick={() => setViewingKeyDetail(null)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                startEditKey(key);
                setViewingKeyDetail(null);
              }}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
        {!isAddingKey && !editingKey && (
          <button
            onClick={() => setIsAddingKey(true)}
            className="inline-flex items-center text-sm px-3 py-1.5 border border-transparent font-medium rounded text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add New Key
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAddingKey || editingKey) && (
        <form
          onSubmit={handleSubmit(editingKey ? handleEditKey : handleAddKey)}
          className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <h3 className="text-md font-medium mb-4">
            {editingKey ? "Edit API Key" : "Add New API Key"}
          </h3>

          <div className="mb-4">
            <label htmlFor="api_name" className="block text-sm font-medium text-gray-700 mb-1">
              API Name
            </label>
            <input
              id="api_name"
              type="text"
              className={`w-full px-3 py-2 border ${
                errors.api_name ? "border-red-300" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="e.g., GitHub, Twitter, OpenAI"
              {...register("api_name")}
              disabled={isSubmitting}
            />
            {errors.api_name && (
              <p className="mt-1 text-sm text-red-600">{errors.api_name.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              id="api_key"
              type="text"
              className={`w-full px-3 py-2 border ${
                errors.api_key ? "border-red-300" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Enter your API key"
              {...register("api_key")}
              disabled={isSubmitting}
            />
            {errors.api_key && (
              <p className="mt-1 text-sm text-red-600">{errors.api_key.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingKey ? "Updating..." : "Adding..."}
                </>
              ) : (
                editingKey ? "Update Key" : "Add Key"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading API keys...</p>
        </div>
      )}

      {/* API Keys List */}
      {!isLoading && apiKeys.length > 0 ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  API Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  API Key
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apiKeys.map((key) => (
                <tr key={key.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {key.api_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="font-mono">
                        {isLargeKey(key.api_key)
                          ? "••••••••••••" + key.api_key.slice(-4)
                          : showApiKey[key.id]
                          ? key.api_key
                          : "••••••••••••" + key.api_key.slice(-4)}
                      </span>
                      {isLargeKey(key.api_key) ? (
                        <button
                          onClick={() => setViewingKeyDetail(key.id)}
                          className="ml-2 text-blue-400 hover:text-blue-600"
                          aria-label="View API key details"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          aria-label={showApiKey[key.id] ? "Hide API key" : "Show API key"}
                        >
                          {showApiKey[key.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => copyToClipboard(key.api_key, key.id)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Copy API key"
                      >
                        {copiedKey === key.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => startEditKey(key)}
                        className="text-blue-600 hover:text-blue-900"
                        aria-label="Edit API key"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-600 hover:text-red-900"
                        aria-label="Delete API key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !isLoading ? (
        // Empty state when no API keys are added
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <Key className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">No API keys added yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Start by adding an API key to use in your requests
          </p>
          {!isAddingKey && (
            <button
              onClick={() => setIsAddingKey(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First API Key
            </button>
          )}
        </div>
      ) : null}
      
      {/* API Key Detail Modal */}
      {renderKeyDetailView()}
    </div>
  );
} 