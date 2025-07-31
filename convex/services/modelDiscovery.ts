import { v } from "convex/values";
import { mutation, query, action } from "../_generated/server";
import { api } from "../_generated/api";
import { createEnhancedReplicateClient } from "../lib/replicateClient";

/**
 * Interface for discovered model information
 */
export interface DiscoveredModel {
  id: string; // owner/name format
  name: string;
  owner: string;
  description: string;
  version?: string;
  inputSchema?: any;
  outputSchema?: any;
  supportedParameters: ModelParameter[];
  pricing?: ModelPricing;
  capabilities: ModelCapabilities;
  lastUpdated: Date;
  discoveredAt: number;
  isVideoModel: boolean;
  confidence: number; // 0-100, how confident we are this is a video model
}

/**
 * Interface for model parameters
 */
export interface ModelParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  default?: any;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

/**
 * Interface for model pricing information
 */
export interface ModelPricing {
  costPerSecond?: number;
  costPerPrediction?: number;
  currency: string;
  estimatedFrom: 'api' | 'documentation' | 'heuristic';
}

/**
 * Interface for model capabilities
 */
export interface ModelCapabilities {
  supportedDurations: number[];
  supportedQualities: string[];
  supportedResolutions: string[];
  supportedAspectRatios: string[];
  maxDuration?: number;
  fixedDuration?: number;
  supportsLoop?: boolean;
  supportsCameraConcepts?: boolean;
  supportsStartEndImages?: boolean;
  supportsAudio?: boolean;
  estimatedProcessingTime?: number;
}

/**
 * Model Discovery Service for automatically finding and cataloging Replicate video models
 */
export class ModelDiscoveryService {
  private client: any;
  private ctx: any;

  constructor(ctx: any) {
    this.ctx = ctx;
    this.client = createEnhancedReplicateClient(
      process.env.REPLICATE_API_TOKEN,
      ctx
    );
  }

  /**
   * Discover all video generation models from Replicate
   */
  async discoverVideoModels(): Promise<DiscoveredModel[]> {
    const discoveredModels: DiscoveredModel[] = [];
    let cursor: string | undefined;
    let totalProcessed = 0;
    const maxModels = 1000; // Limit to prevent infinite loops

    console.log('Starting model discovery process...');

    try {
      do {
        const response = await this.client.listModels(cursor);
        
        if (!response.results || response.results.length === 0) {
          break;
        }

        console.log(`Processing batch of ${response.results.length} models...`);

        // Process models in parallel but with rate limiting
        const batchPromises = response.results.map(async (model: any) => {
          try {
            if (this.isVideoGenerationModel(model)) {
              const detailedModel = await this.getDetailedModelInfo(model);
              if (detailedModel) {
                return detailedModel;
              }
            }
          } catch (error) {
            console.warn(`Failed to process model ${model.owner}/${model.name}:`, error);
          }
          return null;
        });

        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Add successful discoveries to our list
        batchResults.forEach(result => {
          if (result) {
            discoveredModels.push(result);
          }
        });

        totalProcessed += response.results.length;
        cursor = response.next;

        // Add delay to respect rate limits
        await this.sleep(1000);

        console.log(`Processed ${totalProcessed} models, found ${discoveredModels.length} video models so far...`);

      } while (cursor && totalProcessed < maxModels);

      console.log(`Model discovery complete. Found ${discoveredModels.length} video models out of ${totalProcessed} total models.`);
      
      return discoveredModels;

    } catch (error) {
      console.error('Model discovery failed:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific model
   */
  private async getDetailedModelInfo(model: any): Promise<DiscoveredModel | null> {
    try {
      // Get full model details
      const detailedModel = await this.client.getModel(model.owner, model.name);
      
      // Parse the model schema if available
      const inputSchema = detailedModel.latest_version?.openapi_schema;
      const supportedParameters = this.extractSupportedParameters(inputSchema);
      const capabilities = this.extractCapabilities(inputSchema, detailedModel);
      const pricing = await this.estimatePricing(detailedModel);

      // Calculate confidence score
      const confidence = this.calculateVideoModelConfidence(detailedModel, supportedParameters);

      return {
        id: `${model.owner}/${model.name}`,
        name: model.name,
        owner: model.owner,
        description: model.description || '',
        version: detailedModel.latest_version?.id,
        inputSchema: inputSchema,
        outputSchema: inputSchema?.components?.schemas?.Output,
        supportedParameters,
        pricing,
        capabilities,
        lastUpdated: new Date(detailedModel.latest_version?.created_at || Date.now()),
        discoveredAt: Date.now(),
        isVideoModel: confidence > 70, // High confidence threshold
        confidence,
      };

    } catch (error) {
      console.warn(`Failed to get detailed info for ${model.owner}/${model.name}:`, error);
      return null;
    }
  }

  /**
   * Check if a model is likely a video generation model
   */
  private isVideoGenerationModel(model: any): boolean {
    const videoKeywords = [
      'video', 'generation', 'veo', 'luma', 'runway', 'stable-video',
      'animate', 'motion', 'clip', 'movie', 'film', 'cinematic'
    ];
    
    const excludeKeywords = [
      'upscale', 'enhance', 'restore', 'colorize', 'face', 'audio-only',
      'transcription', 'translation', 'chat', 'text-only'
    ];

    const description = (model.description || '').toLowerCase();
    const name = model.name.toLowerCase();
    const searchText = `${name} ${description}`;

    // Check for exclusion keywords first
    if (excludeKeywords.some(keyword => searchText.includes(keyword))) {
      return false;
    }

    // Check for video keywords
    return videoKeywords.some(keyword => searchText.includes(keyword));
  }

  /**
   * Extract supported parameters from OpenAPI schema
   */
  private extractSupportedParameters(inputSchema: any): ModelParameter[] {
    if (!inputSchema?.components?.schemas?.Input?.properties) {
      return [];
    }

    const properties = inputSchema.components.schemas.Input.properties;
    const required = inputSchema.components.schemas.Input.required || [];
    const parameters: ModelParameter[] = [];

    Object.entries(properties).forEach(([name, schema]: [string, any]) => {
      parameters.push({
        name,
        type: this.mapSchemaType(schema.type),
        required: required.includes(name),
        description: schema.description,
        default: schema.default,
        enum: schema.enum,
        minimum: schema.minimum,
        maximum: schema.maximum,
        pattern: schema.pattern,
      });
    });

    return parameters;
  }

  /**
   * Extract model capabilities from schema and model info
   */
  private extractCapabilities(inputSchema: any, model: any): ModelCapabilities {
    const capabilities: ModelCapabilities = {
      supportedDurations: [],
      supportedQualities: ['standard'], // Default
      supportedResolutions: [],
      supportedAspectRatios: ['16:9'], // Default
    };

    if (!inputSchema?.components?.schemas?.Input?.properties) {
      return capabilities;
    }

    const properties = inputSchema.components.schemas.Input.properties;

    // Extract duration information
    if (properties.duration_seconds) {
      const durationSchema = properties.duration_seconds;
      if (durationSchema.enum) {
        capabilities.supportedDurations = durationSchema.enum;
      } else if (durationSchema.minimum && durationSchema.maximum) {
        // Generate common durations within range
        const min = durationSchema.minimum;
        const max = durationSchema.maximum;
        capabilities.supportedDurations = [5, 8, 10, 15, 30].filter(d => d >= min && d <= max);
      } else if (durationSchema.default) {
        capabilities.supportedDurations = [durationSchema.default];
        capabilities.fixedDuration = durationSchema.default;
      }
    }

    // Extract quality information
    if (properties.quality) {
      const qualitySchema = properties.quality;
      if (qualitySchema.enum) {
        capabilities.supportedQualities = qualitySchema.enum;
      }
    }

    // Extract resolution information
    if (properties.resolution) {
      const resolutionSchema = properties.resolution;
      if (resolutionSchema.enum) {
        capabilities.supportedResolutions = resolutionSchema.enum;
      }
    }

    // Extract aspect ratio information
    if (properties.aspect_ratio) {
      const aspectSchema = properties.aspect_ratio;
      if (aspectSchema.enum) {
        capabilities.supportedAspectRatios = aspectSchema.enum;
      }
    }

    // Check for advanced features
    capabilities.supportsLoop = !!properties.loop;
    capabilities.supportsCameraConcepts = !!properties.camera_concept || !!properties.camera_movement;
    capabilities.supportsStartEndImages = !!properties.start_image || !!properties.end_image;
    capabilities.supportsAudio = !!properties.audio || !!properties.sound;

    // Set max duration
    if (capabilities.supportedDurations.length > 0) {
      capabilities.maxDuration = Math.max(...capabilities.supportedDurations);
    }

    return capabilities;
  }

  /**
   * Estimate pricing for a model
   */
  private async estimatePricing(model: any): Promise<ModelPricing> {
    // This is a simplified pricing estimation
    // In a real implementation, you might have a database of known pricing
    // or use heuristics based on model complexity
    
    const modelName = model.name.toLowerCase();
    const owner = model.owner.toLowerCase();

    // Known pricing patterns (these would be updated based on actual Replicate pricing)
    if (owner === 'google' || modelName.includes('veo')) {
      return {
        costPerSecond: 0.75,
        currency: 'USD',
        estimatedFrom: 'heuristic',
      };
    }

    if (owner === 'luma' || modelName.includes('luma')) {
      if (modelName.includes('flash')) {
        return {
          costPerSecond: 0.12,
          currency: 'USD',
          estimatedFrom: 'heuristic',
        };
      }
      return {
        costPerSecond: 0.18,
        currency: 'USD',
        estimatedFrom: 'heuristic',
      };
    }

    // Default pricing for unknown models
    return {
      costPerSecond: 0.25,
      currency: 'USD',
      estimatedFrom: 'heuristic',
    };
  }

  /**
   * Calculate confidence score that this is a video generation model
   */
  private calculateVideoModelConfidence(model: any, parameters: ModelParameter[]): number {
    let confidence = 0;

    // Check model name and description
    const videoKeywords = ['video', 'generation', 'animate', 'motion', 'clip'];
    const strongVideoKeywords = ['veo', 'luma', 'runway', 'stable-video'];
    
    const searchText = `${model.name} ${model.description || ''}`.toLowerCase();

    // Strong indicators
    if (strongVideoKeywords.some(keyword => searchText.includes(keyword))) {
      confidence += 40;
    }

    // General video keywords
    if (videoKeywords.some(keyword => searchText.includes(keyword))) {
      confidence += 20;
    }

    // Check parameters for video-specific inputs
    const videoParameters = ['prompt', 'duration_seconds', 'aspect_ratio', 'resolution'];
    const foundVideoParams = parameters.filter(p => 
      videoParameters.some(vp => p.name.includes(vp))
    ).length;
    
    confidence += foundVideoParams * 10;

    // Check for prompt parameter (most video models have this)
    if (parameters.some(p => p.name === 'prompt' && p.type === 'string')) {
      confidence += 15;
    }

    // Check for duration parameter
    if (parameters.some(p => p.name.includes('duration'))) {
      confidence += 15;
    }

    // Bonus for having multiple video-related parameters
    if (foundVideoParams >= 3) {
      confidence += 10;
    }

    return Math.min(confidence, 100);
  }

  /**
   * Map OpenAPI schema types to our parameter types
   */
  private mapSchemaType(schemaType: string): ModelParameter['type'] {
    switch (schemaType) {
      case 'string': return 'string';
      case 'number': 
      case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'array': return 'array';
      case 'object': return 'object';
      default: return 'string';
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update existing models with discovered information
   */
  async updateExistingModels(discoveredModels: DiscoveredModel[]): Promise<{
    updated: number;
    added: number;
    errors: string[];
  }> {
    let updated = 0;
    let added = 0;
    const errors: string[] = [];

    for (const discoveredModel of discoveredModels) {
      try {
        // Check if model already exists
        const existingModel = await this.ctx.db
          .query("models")
          .withIndex("by_model_id", (q: any) => q.eq("modelId", discoveredModel.id))
          .first();

        const modelData = {
          modelId: discoveredModel.id,
          name: discoveredModel.name,
          description: discoveredModel.description,
          version: discoveredModel.version,
          owner: discoveredModel.owner,
          
          // Capabilities
          supportedDurations: discoveredModel.capabilities.supportedDurations,
          supportedQualities: discoveredModel.capabilities.supportedQualities,
          supportedResolutions: discoveredModel.capabilities.supportedResolutions,
          supportedAspectRatios: discoveredModel.capabilities.supportedAspectRatios,
          maxDuration: discoveredModel.capabilities.maxDuration,
          fixedDuration: discoveredModel.capabilities.fixedDuration,
          
          // Features
          supportsLoop: discoveredModel.capabilities.supportsLoop,
          supportsCameraConcepts: discoveredModel.capabilities.supportsCameraConcepts,
          supportsStartEndImages: discoveredModel.capabilities.supportsStartEndImages,
          supportsAudio: discoveredModel.capabilities.supportsAudio,
          
          // Pricing
          costPerSecond: discoveredModel.pricing?.costPerSecond || 0.25,
          
          // Discovery metadata
          inputSchema: discoveredModel.inputSchema,
          outputSchema: discoveredModel.outputSchema,
          discoveredAt: discoveredModel.discoveredAt,
          lastValidatedAt: Date.now(),
          schemaVersion: discoveredModel.version,
          
          // Technical details
          replicateModelId: discoveredModel.id,
          modelParameters: discoveredModel.inputSchema,
          
          // Default settings for discovered models
          isPremium: (discoveredModel.pricing?.costPerSecond || 0) > 0.5,
          isFast: (discoveredModel.pricing?.costPerSecond || 0) < 0.2,
          isActive: discoveredModel.confidence > 80, // Only activate high-confidence models
          isDefault: false,
          isDeprecated: false,
          provider: discoveredModel.owner,
          category: this.categorizeModel(discoveredModel),
          tags: this.generateTags(discoveredModel),
          
          updatedAt: Date.now(),
        };

        if (existingModel) {
          // Update existing model
          await this.ctx.db.patch(existingModel._id, modelData);
          updated++;
        } else {
          // Add new model
          await this.ctx.db.insert("models", {
            ...modelData,
            totalGenerations: 0,
            createdAt: Date.now(),
          });
          added++;
        }

      } catch (error) {
        const errorMsg = `Failed to update model ${discoveredModel.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return { updated, added, errors };
  }

  /**
   * Categorize a model based on its characteristics
   */
  private categorizeModel(model: DiscoveredModel): string {
    const costPerSecond = model.pricing?.costPerSecond || 0;
    
    if (costPerSecond > 0.5) {
      return 'premium';
    } else if (costPerSecond < 0.2) {
      return 'budget';
    } else {
      return 'standard';
    }
  }

  /**
   * Generate tags for a model based on its characteristics
   */
  private generateTags(model: DiscoveredModel): string[] {
    const tags: string[] = [];
    
    // Add pricing-based tags
    const costPerSecond = model.pricing?.costPerSecond || 0;
    if (costPerSecond > 0.5) {
      tags.push('premium', 'high-quality');
    } else if (costPerSecond < 0.2) {
      tags.push('budget', 'cost-effective');
    }
    
    // Add capability-based tags
    if (model.capabilities.supportsLoop) {
      tags.push('loop-support');
    }
    
    if (model.capabilities.supportsCameraConcepts) {
      tags.push('camera-control');
    }
    
    if (model.capabilities.supportsAudio) {
      tags.push('audio-support');
    }
    
    // Add duration-based tags
    if (model.capabilities.fixedDuration) {
      tags.push('fixed-duration');
    } else if (model.capabilities.supportedDurations.length > 3) {
      tags.push('flexible-duration');
    }
    
    // Add provider-based tags
    if (model.owner === 'google') {
      tags.push('google', 'enterprise');
    } else if (model.owner === 'luma') {
      tags.push('luma', 'fast');
    }
    
    return tags;
  }
}

// Export a factory function for creating the service
export function createModelDiscoveryService(ctx: any): ModelDiscoveryService {
  return new ModelDiscoveryService(ctx);
}