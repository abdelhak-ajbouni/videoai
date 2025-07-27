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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  DollarSign,
  AlertCircle,
  Star
} from "lucide-react";
import { toast } from "sonner";

interface Model {
  _id: string;
  modelId: string;
  name: string;
  description: string;
  version?: string;
  costPerSecond: number;
  supportedDurations: number[];
  supportedQualities: string[];
  maxDuration?: number;
  fixedDuration?: number;
  isPremium: boolean;
  isActive: boolean;
  isDefault: boolean;
  isDeprecated: boolean;
  provider: string;
  category?: string;
  tags?: string[];
  replicateModelId: string;
  modelParameters?: unknown;
  requirements?: unknown;
  totalGenerations?: number;
  averageGenerationTime?: number;
  successRate?: number;
  createdAt: number;
  updatedAt: number;
  deprecatedAt?: number;
}

export function ModelManager() {
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Model>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newModel, setNewModel] = useState<Partial<Model>>({});

  const models = useQuery(api.models.getActiveModels);
  const modelStats = useQuery(api.models.getModelStats);
  const createModel = useMutation(api.models.createModel);
  const updateModel = useMutation(api.models.updateModel);
  const deleteModel = useMutation(api.models.deleteModel);

  const categories = [
    { id: "all", name: "All Models" },
    { id: "premium", name: "Premium Models" },
    { id: "budget", name: "Budget Models" },
    { id: "experimental", name: "Experimental Models" },
  ];

  const providers = ["Google", "Luma", "OpenAI", "Anthropic", "Stability AI"];

  const filteredModels = models?.filter(model =>
    selectedCategory === "all" || model.category === selectedCategory
  ) || [];

  const handleEdit = (model: Model) => {
    setEditingModel(model._id);
    setEditData({
      name: model.name,
      description: model.description,
      version: model.version,
      costPerSecond: model.costPerSecond,
      supportedDurations: model.supportedDurations,
      supportedQualities: model.supportedQualities,
      maxDuration: model.maxDuration,
      fixedDuration: model.fixedDuration,
      isPremium: model.isPremium,
      isActive: model.isActive,
      isDefault: model.isDefault,
      isDeprecated: model.isDeprecated,
      provider: model.provider,
      category: model.category,
      tags: model.tags,
      replicateModelId: model.replicateModelId,
      modelParameters: model.modelParameters,
      requirements: model.requirements,
    });
  };

  const handleSave = async (model: Model) => {
    try {
      await updateModel({
        modelId: model.modelId,
        ...editData,
      });

      setEditingModel(null);
      setEditData({});
      toast.success(`Model "${model.name}" updated successfully`);
    } catch (error) {
      toast.error(`Failed to update model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    setEditingModel(null);
    setEditData({});
  };

  const handleCreate = async () => {
    try {
      if (!newModel.modelId || !newModel.name || !newModel.description || !newModel.costPerSecond) {
        toast.error("Please fill in all required fields");
        return;
      }

      await createModel({
        modelId: newModel.modelId,
        name: newModel.name,
        description: newModel.description,
        version: newModel.version,
        costPerSecond: newModel.costPerSecond!,
        supportedDurations: newModel.supportedDurations || [],
        supportedQualities: newModel.supportedQualities || [],
        maxDuration: newModel.maxDuration,
        fixedDuration: newModel.fixedDuration,
        isPremium: newModel.isPremium || false,
        isActive: newModel.isActive || true,
        isDefault: newModel.isDefault || false,
        isDeprecated: false,
        provider: newModel.provider || "Unknown",
        category: newModel.category,
        tags: newModel.tags,
        replicateModelId: newModel.replicateModelId || newModel.modelId,
        modelParameters: newModel.modelParameters,
        requirements: newModel.requirements,
      });

      setShowCreateForm(false);
      setNewModel({});
      toast.success("Model created successfully");
    } catch (error) {
      toast.error(`Failed to create model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (model: Model) => {
    if (!confirm(`Are you sure you want to delete "${model.name}"? This will deactivate the model.`)) {
      return;
    }

    try {
      await deleteModel({ modelId: model.modelId });
      toast.success(`Model "${model.name}" deleted successfully`);
    } catch (error) {
      toast.error(`Failed to delete model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getModelStats = (modelId: string) => {
    return modelStats?.find(stat => stat.modelId === modelId);
  };

  const renderModelCard = (model: Model) => {
    const stats = getModelStats(model.modelId);
    const isEditing = editingModel === model._id;

    return (
      <Card key={model._id} className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {model.name}
                {model.isDefault && <Star className="h-4 w-4 text-yellow-500" />}
                {model.isPremium && <Star className="h-4 w-4 text-purple-500" />}
                {model.isDeprecated && <AlertCircle className="h-4 w-4 text-red-500" />}
              </CardTitle>
              <CardDescription>{model.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={model.isActive ? "default" : "secondary"}>
                {model.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">{model.provider}</Badge>
              {model.category && (
                <Badge variant="outline">{model.category}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Model ID */}
            <div>
              <Label className="text-sm font-medium">Model ID</Label>
              <div className="font-mono text-sm text-gray-600">{model.modelId}</div>
            </div>

            {/* Cost and Capabilities */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Cost per Second</Label>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-mono">${model.costPerSecond.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Supported Durations</Label>
                <div className="flex flex-wrap gap-1">
                  {model.supportedDurations.map(duration => (
                    <Badge key={duration} variant="outline" className="text-xs">
                      {duration}s
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.totalGenerations}</div>
                  <div className="text-xs text-gray-600">Generations</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {stats.averageGenerationTime ? `${stats.averageGenerationTime.toFixed(1)}s` : "N/A"}
                  </div>
                  <div className="text-xs text-gray-600">Avg Time</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.successRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-600">Success Rate</div>
                </div>
              </div>
            )}

            {/* Tags */}
            {model.tags && model.tags.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {model.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={() => handleSave(model)}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(model)}>
                    <Settings className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(model)}
                    disabled={model.isDefault}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>

            {/* Edit Form */}
            {isEditing && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editData.name || ""}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Cost per Second</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.costPerSecond || ""}
                      onChange={(e) => setEditData({ ...editData, costPerSecond: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Provider</Label>
                    <Select
                      value={editData.provider || ""}
                      onValueChange={(value) => setEditData({ ...editData, provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map(provider => (
                          <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={editData.category || ""}
                      onValueChange={(value) => setEditData({ ...editData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {categories.slice(1).map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Description</Label>
                  <Textarea
                    value={editData.description || ""}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editData.isPremium || false}
                      onCheckedChange={(checked) => setEditData({ ...editData, isPremium: checked })}
                    />
                    <Label>Premium Model</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editData.isActive || false}
                      onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editData.isDefault || false}
                      onCheckedChange={(checked) => setEditData({ ...editData, isDefault: checked })}
                    />
                    <Label>Default Model</Label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!models) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading models...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Model Management</h2>
          <p className="text-gray-600">Manage AI models and their configurations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Model
          </Button>
        </div>
      </div>

      {/* Create Model Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Model</CardTitle>
            <CardDescription>Add a new AI model to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Model ID *</Label>
                <Input
                  placeholder="e.g., google/veo-3"
                  value={newModel.modelId || ""}
                  onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  placeholder="e.g., Google Veo-3"
                  value={newModel.name || ""}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Provider</Label>
                <Select
                  value={newModel.provider || ""}
                  onValueChange={(value) => setNewModel({ ...newModel, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(provider => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cost per Second *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.75"
                  value={newModel.costPerSecond || ""}
                  onChange={(e) => setNewModel({ ...newModel, costPerSecond: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the model's capabilities and use cases"
                value={newModel.description || ""}
                onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleCreate}>Create Model</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <div className="space-y-4">
              {filteredModels.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No models found in this category.
                </div>
              ) : (
                filteredModels.map(renderModelCard)
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 