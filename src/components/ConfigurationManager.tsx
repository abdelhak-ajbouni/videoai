"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Configuration {
  _id: string;
  key: string;
  category: string;
  name: string;
  description?: string;
  value: unknown;
  dataType: "string" | "number" | "boolean" | "array" | "object";
  isActive: boolean;
  isEditable: boolean;
  minValue?: number;
  maxValue?: number;
  allowedValues?: string[];
  updatedAt: number;
}

export function ConfigurationManager() {
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<unknown>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const configs = useQuery(api.configurations.getAllConfigs);
  const updateConfig = useMutation(api.configurations.updateConfig);

  const categories = [
    { id: "all", name: "All Configurations" },
    { id: "business", name: "Business Settings" },
    { id: "pricing", name: "Pricing & Costs" },
    { id: "models", name: "AI Models" },
    { id: "features", name: "Feature Flags" },
    { id: "limits", name: "System Limits" },
    { id: "subscriptions", name: "Subscription Settings" },
  ];

  const filteredConfigs = configs?.filter(config =>
    selectedCategory === "all" || config.category === selectedCategory
  ) || [];

  const handleEdit = (config: Configuration) => {
    setEditingConfig(config._id);
    setEditValue(config.value);
  };

  const handleSave = async (config: Configuration) => {
    try {
      await updateConfig({
        key: config.key,
        value: editValue,
      });

      setEditingConfig(null);
      setEditValue(null);
      toast.success(`Configuration "${config.name}" updated successfully`);
    } catch (error) {
      toast.error(`Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    setEditingConfig(null);
    setEditValue(null);
  };

  const renderValueEditor = (config: Configuration) => {
    if (!config.isEditable) {
      return (
        <div className="text-sm text-gray-500 italic">
          Not editable
        </div>
      );
    }

    switch (config.dataType) {
      case "string":
        return (
          <Input
            value={editValue || ""}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter string value"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={editValue || ""}
            onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
            min={config.minValue}
            max={config.maxValue}
            placeholder="Enter number value"
          />
        );

      case "boolean":
        return (
          <Select value={editValue?.toString() || "false"} onValueChange={(value) => setEditValue(value === "true")}>
            <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-xl">
              <SelectItem value="true" className="py-2 text-gray-900 dark:text-white">True</SelectItem>
              <SelectItem value="false" className="py-2 text-gray-900 dark:text-white">False</SelectItem>
            </SelectContent>
          </Select>
        );

      case "array":
        return (
          <Input
            value={Array.isArray(editValue) ? editValue.join(", ") : ""}
            onChange={(e) => setEditValue(e.target.value.split(", ").filter(Boolean))}
            placeholder="Enter comma-separated values"
          />
        );

      case "object":
        return (
          <textarea
            className="w-full p-2 border rounded-md text-sm font-mono"
            rows={4}
            value={JSON.stringify(editValue, null, 2)}
            onChange={(e) => {
              try {
                setEditValue(JSON.parse(e.target.value));
              } catch {
                // Allow invalid JSON during typing
              }
            }}
            placeholder="Enter JSON object"
          />
        );

      default:
        return <div className="text-sm text-gray-500">Unsupported type</div>;
    }
  };

  const renderValueDisplay = (config: Configuration) => {
    const value = config.value;

    switch (config.dataType) {
      case "boolean":
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "True" : "False"}
          </Badge>
        );

      case "object":
        return (
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">
            {JSON.stringify(value, null, 2)}
          </pre>
        );

      case "array":
        return (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(value) && value.map((item, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        );

      default:
        return <span className="font-mono text-sm">{String(value)}</span>;
    }
  };

  if (!configs) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuration Management</h2>
          <p className="text-gray-600">Manage system-wide configurations and settings</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-7">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <div className="grid gap-4">
              {filteredConfigs
                .filter(config => category.id === "all" || config.category === category.id)
                .map((config) => (
                  <Card key={config._id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{config.name}</CardTitle>
                          <CardDescription>{config.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{config.dataType}</Badge>
                          {config.isEditable ? (
                            <Badge variant="default">Editable</Badge>
                          ) : (
                            <Badge variant="secondary">Read-only</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Key</Label>
                          <div className="font-mono text-sm text-gray-600">{config.key}</div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm font-medium">Current Value</Label>
                          <div className="mt-2">
                            {editingConfig === config._id ? (
                              <div className="space-y-2">
                                {renderValueEditor(config)}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSave(config)}
                                    disabled={!config.isEditable}
                                  >
                                    <Save className="h-4 w-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancel}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  {renderValueDisplay(config)}
                                </div>
                                {config.isEditable && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(config)}
                                  >
                                    <Settings className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {(config.minValue !== undefined || config.maxValue !== undefined) && (
                          <div>
                            <Label className="text-sm font-medium">Constraints</Label>
                            <div className="text-sm text-gray-600">
                              {config.minValue !== undefined && `Min: ${config.minValue}`}
                              {config.minValue !== undefined && config.maxValue !== undefined && " | "}
                              {config.maxValue !== undefined && `Max: ${config.maxValue}`}
                            </div>
                          </div>
                        )}

                        {config.allowedValues && config.allowedValues.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Allowed Values</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {config.allowedValues.map((value) => (
                                <Badge key={value} variant="outline" className="text-xs">
                                  {value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Last updated: {new Date(config.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 