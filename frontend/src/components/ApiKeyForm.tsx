import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define API key schema for validation
const apiKeySchema = z.object({
  api_name: z.string().min(1, "API name is required"),
  api_key: z.string().min(1, "API key is required"),
});

export type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

interface ApiKeyFormProps {
  defaultValues?: {
    api_name: string;
    api_key: string;
  };
  isSubmitting: boolean;
  onSubmit: (data: ApiKeyFormValues) => void;
  onCancel: () => void;
  submitText: string;
}

export function ApiKeyForm({
  defaultValues = { api_name: "", api_key: "" },
  isSubmitting,
  onSubmit,
  onCancel,
  submitText
}: ApiKeyFormProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="api_name">API Name</Label>
        <Input
          id="api_name"
          {...register("api_name")}
          placeholder="e.g., GitHub, Stripe, etc."
          className={errors.api_name ? "border-red-500" : ""}
        />
        {errors.api_name && (
          <p className="text-xs text-red-500 mt-1">{errors.api_name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="api_key">API Key</Label>
        <div className="relative">
          <Input
            id="api_key"
            {...register("api_key")}
            type={showApiKey ? "text" : "password"}
            placeholder="Your API key"
            className={errors.api_key ? "border-red-500 pr-10" : "pr-10"}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.api_key && (
          <p className="text-xs text-red-500 mt-1">{errors.api_key.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitText
          )}
        </Button>
      </div>
    </form>
  );
} 