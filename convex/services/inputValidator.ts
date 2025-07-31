import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

/**
 * Interface for validation results
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
  normalizedInput?: Record<string, any>;
}

/**
 * Interface for model schema
 */
export interface ModelSchema {
  required: Record<string, ParameterDefinition>;
  optional: Record<string, ParameterDefinition>;
  metadata: {
    modelId: string;
    version?: string;
    lastUpdated: number;
  };
}

/**
 * Interface for parameter definitions
 */
export interface ParameterDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: any;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: ParameterDefinition; // For arrays
  properties?: Record<string, ParameterDefinition>; // For objects
}

/**
 * Input validation service for validating user inputs against model schemas
 */
export class InputValidator {
  private schemaCache: Map<string, ModelSchema> = new Map();
  private ctx: any;

  constructor(ctx: any) {
    this.ctx = ctx;
  }

  /**
   * Validate input against a model's schema
   */
  async validateInput(
    modelId: string,
    input: Record<string, any>
  ): Promise<ValidationResult> {
    try {
      const schema = await this.getModelSchema(modelId);
      
      if (!schema) {
        return {
          valid: false,
          errors: [`Model schema not found for ${modelId}`],
          warnings: [],
          suggestions: ['Please check if the model exists and has a valid schema'],
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];
      const normalizedInput: Record<string, any> = { ...input };

      // Validate required parameters
      for (const [paramName, paramDef] of Object.entries(schema.required)) {
        if (!(paramName in input)) {
          errors.push(`Required parameter '${paramName}' is missing`);
          
          // Suggest default value if available
          if (paramDef.default !== undefined) {
            suggestions.push(`Consider using default value for '${paramName}': ${JSON.stringify(paramDef.default)}`);
            normalizedInput[paramName] = paramDef.default;
          }
        } else {
          const validationResult = this.validateParameter(paramName, input[paramName], paramDef);
          errors.push(...validationResult.errors);
          warnings.push(...validationResult.warnings);
          suggestions.push(...validationResult.suggestions);
          
          if (validationResult.normalizedValue !== undefined) {
            normalizedInput[paramName] = validationResult.normalizedValue;
          }
        }
      }

      // Validate optional parameters
      for (const [paramName, value] of Object.entries(input)) {
        if (paramName in schema.required) {
          continue; // Already validated above
        }
        
        if (paramName in schema.optional) {
          const validationResult = this.validateParameter(paramName, value, schema.optional[paramName]);
          errors.push(...validationResult.errors);
          warnings.push(...validationResult.warnings);
          suggestions.push(...validationResult.suggestions);
          
          if (validationResult.normalizedValue !== undefined) {
            normalizedInput[paramName] = validationResult.normalizedValue;
          }
        } else {
          warnings.push(`Unknown parameter '${paramName}' - it may be ignored by the model`);
          suggestions.push(`Remove '${paramName}' or check the model documentation for valid parameters`);
        }
      }

      // Add missing optional parameters with defaults
      for (const [paramName, paramDef] of Object.entries(schema.optional)) {
        if (!(paramName in input) && paramDef.default !== undefined) {
          normalizedInput[paramName] = paramDef.default;
          suggestions.push(`Added default value for optional parameter '${paramName}': ${JSON.stringify(paramDef.default)}`);
        }
      }

      // Validate parameter combinations and constraints
      const combinationResult = this.validateParameterCombinations(modelId, normalizedInput);
      errors.push(...combinationResult.errors);
      warnings.push(...combinationResult.warnings);
      suggestions.push(...combinationResult.suggestions);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        normalizedInput: errors.length === 0 ? normalizedInput : undefined,
      };

    } catch (error) {
      console.error(`Validation error for model ${modelId}:`, error);
      return {
        valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        suggestions: ['Please try again or contact support if the issue persists'],
      };
    }
  }

  /**
   * Validate a single parameter
   */
  private validateParameter(
    paramName: string,
    value: any,
    definition: ParameterDefinition
  ): {
    errors: string[];
    warnings: string[];
    suggestions: string[];
    normalizedValue?: any;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let normalizedValue = value;

    // Type validation
    const typeValidation = this.validateType(value, definition.type);
    if (!typeValidation.valid) {
      errors.push(`Parameter '${paramName}' ${typeValidation.error}`);
      return { errors, warnings, suggestions };
    }

    // Normalize value based on type
    normalizedValue = typeValidation.normalizedValue ?? value;

    // Enum validation
    if (definition.enum && definition.enum.length > 0) {
      if (!definition.enum.includes(normalizedValue)) {
        errors.push(`Parameter '${paramName}' must be one of: ${definition.enum.join(', ')}`);
        
        // Suggest closest match
        const closest = this.findClosestMatch(String(normalizedValue), definition.enum.map(String));
        if (closest) {
          suggestions.push(`Did you mean '${closest}' for parameter '${paramName}'?`);
        }
        
        return { errors, warnings, suggestions };
      }
    }

    // String-specific validations
    if (definition.type === 'string' && typeof normalizedValue === 'string') {
      if (definition.minLength && normalizedValue.length < definition.minLength) {
        errors.push(`Parameter '${paramName}' must be at least ${definition.minLength} characters long`);
      }
      
      if (definition.maxLength && normalizedValue.length > definition.maxLength) {
        errors.push(`Parameter '${paramName}' must be no more than ${definition.maxLength} characters long`);
        suggestions.push(`Consider shortening the '${paramName}' parameter`);
      }
      
      if (definition.pattern) {
        const regex = new RegExp(definition.pattern);
        if (!regex.test(normalizedValue)) {
          errors.push(`Parameter '${paramName}' does not match the required pattern`);
          suggestions.push(`Check the format requirements for '${paramName}'`);
        }
      }
    }

    // Number-specific validations
    if (definition.type === 'number' && typeof normalizedValue === 'number') {
      if (definition.minimum !== undefined && normalizedValue < definition.minimum) {
        errors.push(`Parameter '${paramName}' must be at least ${definition.minimum}`);
      }
      
      if (definition.maximum !== undefined && normalizedValue > definition.maximum) {
        errors.push(`Parameter '${paramName}' must be no more than ${definition.maximum}`);
      }
    }

    // Array-specific validations
    if (definition.type === 'array' && Array.isArray(normalizedValue)) {
      if (definition.items) {
        const arrayErrors: string[] = [];
        const arrayWarnings: string[] = [];
        const arraySuggestions: string[] = [];
        
        normalizedValue.forEach((item, index) => {
          const itemValidation = this.validateParameter(`${paramName}[${index}]`, item, definition.items!);
          arrayErrors.push(...itemValidation.errors);
          arrayWarnings.push(...itemValidation.warnings);
          arraySuggestions.push(...itemValidation.suggestions);
        });
        
        errors.push(...arrayErrors);
        warnings.push(...arrayWarnings);
        suggestions.push(...arraySuggestions);
      }
    }

    // Object-specific validations
    if (definition.type === 'object' && typeof normalizedValue === 'object' && normalizedValue !== null) {
      if (definition.properties) {
        for (const [propName, propDef] of Object.entries(definition.properties)) {
          if (propName in normalizedValue) {
            const propValidation = this.validateParameter(`${paramName}.${propName}`, normalizedValue[propName], propDef);
            errors.push(...propValidation.errors);
            warnings.push(...propValidation.warnings);
            suggestions.push(...propValidation.suggestions);
          }
        }
      }
    }

    return { errors, warnings, suggestions, normalizedValue };
  }

  /**
   * Validate parameter type and attempt normalization
   */
  private validateType(value: any, expectedType: string): {
    valid: boolean;
    error?: string;
    normalizedValue?: any;
  } {
    switch (expectedType) {
      case 'string':
        if (typeof value === 'string') {
          return { valid: true };
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
          return { valid: true, normalizedValue: String(value) };
        }
        return { valid: false, error: 'must be a string' };

      case 'number':
        if (typeof value === 'number' && !isNaN(value)) {
          return { valid: true };
        }
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          if (!isNaN(parsed)) {
            return { valid: true, normalizedValue: parsed };
          }
        }
        return { valid: false, error: 'must be a number' };

      case 'boolean':
        if (typeof value === 'boolean') {
          return { valid: true };
        }
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (lower === 'true' || lower === 'false') {
            return { valid: true, normalizedValue: lower === 'true' };
          }
        }
        if (typeof value === 'number') {
          return { valid: true, normalizedValue: Boolean(value) };
        }
        return { valid: false, error: 'must be a boolean' };

      case 'array':
        if (Array.isArray(value)) {
          return { valid: true };
        }
        return { valid: false, error: 'must be an array' };

      case 'object':
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return { valid: true };
        }
        return { valid: false, error: 'must be an object' };

      default:
        return { valid: true }; // Unknown type, assume valid
    }
  }

  /**
   * Validate parameter combinations and model-specific constraints
   */
  private validateParameterCombinations(
    modelId: string,
    input: Record<string, any>
  ): {
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Model-specific validation rules
    if (modelId.includes('veo')) {
      // Google Veo-3 specific validations
      if (input.duration_seconds && input.duration_seconds !== 8) {
        errors.push('Google Veo-3 only supports 8-second duration');
        suggestions.push('Set duration_seconds to 8 for Google Veo-3');
      }
    }

    if (modelId.includes('luma')) {
      // Luma models specific validations
      if (input.duration_seconds && ![5, 9].includes(input.duration_seconds)) {
        errors.push('Luma models only support 5 or 9 second durations');
        suggestions.push('Set duration_seconds to either 5 or 9 for Luma models');
      }

      // Camera concept validation
      if (input.camera_concept && input.loop) {
        warnings.push('Camera concepts may not work well with looping videos');
        suggestions.push('Consider disabling loop when using camera concepts');
      }
    }

    // General validations
    if (input.prompt && typeof input.prompt === 'string') {
      if (input.prompt.length < 10) {
        warnings.push('Very short prompts may produce poor results');
        suggestions.push('Consider adding more detail to your prompt for better results');
      }

      if (input.prompt.length > 500) {
        warnings.push('Very long prompts may be truncated');
        suggestions.push('Consider shortening your prompt to under 500 characters');
      }

      // Check for potentially problematic content
      const problematicWords = ['nsfw', 'nude', 'violence', 'gore', 'explicit'];
      const lowerPrompt = input.prompt.toLowerCase();
      const foundProblematic = problematicWords.filter(word => lowerPrompt.includes(word));
      
      if (foundProblematic.length > 0) {
        errors.push('Prompt contains content that may violate content policies');
        suggestions.push('Please review and modify your prompt to comply with content guidelines');
      }
    }

    return { errors, warnings, suggestions };
  }

  /**
   * Get model schema from cache or database
   */
  private async getModelSchema(modelId: string): Promise<ModelSchema | null> {
    // Check cache first
    if (this.schemaCache.has(modelId)) {
      const cached = this.schemaCache.get(modelId)!;
      
      // Check if cache is still fresh (1 hour)
      if (Date.now() - cached.metadata.lastUpdated < 60 * 60 * 1000) {
        return cached;
      }
    }

    // Fetch from database
    const model = await this.ctx.db
      .query("models")
      .withIndex("by_model_id", (q: any) => q.eq("modelId", modelId))
      .first();

    if (!model || !model.inputSchema) {
      return null;
    }

    // Parse schema from OpenAPI format
    const schema = this.parseOpenAPISchema(model.inputSchema, modelId);
    
    // Cache the schema
    this.schemaCache.set(modelId, schema);
    
    return schema;
  }

  /**
   * Parse OpenAPI schema into our internal format
   */
  private parseOpenAPISchema(openApiSchema: any, modelId: string): ModelSchema {
    const required: Record<string, ParameterDefinition> = {};
    const optional: Record<string, ParameterDefinition> = {};

    if (!openApiSchema?.components?.schemas?.Input?.properties) {
      return {
        required,
        optional,
        metadata: {
          modelId,
          lastUpdated: Date.now(),
        },
      };
    }

    const properties = openApiSchema.components.schemas.Input.properties;
    const requiredFields = openApiSchema.components.schemas.Input.required || [];

    for (const [paramName, paramSchema] of Object.entries(properties)) {
      const paramDef = this.parseParameterDefinition(paramSchema as any);
      
      if (requiredFields.includes(paramName)) {
        required[paramName] = paramDef;
      } else {
        optional[paramName] = paramDef;
      }
    }

    return {
      required,
      optional,
      metadata: {
        modelId,
        lastUpdated: Date.now(),
      },
    };
  }

  /**
   * Parse a single parameter definition from OpenAPI schema
   */
  private parseParameterDefinition(schema: any): ParameterDefinition {
    const paramDef: ParameterDefinition = {
      type: this.mapOpenAPIType(schema.type),
      description: schema.description,
      default: schema.default,
      enum: schema.enum,
      minimum: schema.minimum,
      maximum: schema.maximum,
      minLength: schema.minLength,
      maxLength: schema.maxLength,
      pattern: schema.pattern,
    };

    // Handle array items
    if (schema.type === 'array' && schema.items) {
      paramDef.items = this.parseParameterDefinition(schema.items);
    }

    // Handle object properties
    if (schema.type === 'object' && schema.properties) {
      paramDef.properties = {};
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        paramDef.properties[propName] = this.parseParameterDefinition(propSchema as any);
      }
    }

    return paramDef;
  }

  /**
   * Map OpenAPI types to our internal types
   */
  private mapOpenAPIType(openApiType: string): ParameterDefinition['type'] {
    switch (openApiType) {
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
   * Find the closest match from a list of options
   */
  private findClosestMatch(input: string, options: string[]): string | null {
    if (options.length === 0) return null;

    let closest = options[0];
    let minDistance = this.levenshteinDistance(input.toLowerCase(), closest.toLowerCase());

    for (const option of options.slice(1)) {
      const distance = this.levenshteinDistance(input.toLowerCase(), option.toLowerCase());
      if (distance < minDistance) {
        minDistance = distance;
        closest = option;
      }
    }

    // Only suggest if the distance is reasonable
    return minDistance <= Math.max(2, Math.floor(input.length / 3)) ? closest : null;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Clear the schema cache
   */
  clearCache(): void {
    this.schemaCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; models: string[] } {
    return {
      size: this.schemaCache.size,
      models: Array.from(this.schemaCache.keys()),
    };
  }
}

// Export factory function
export function createInputValidator(ctx: any): InputValidator {
  return new InputValidator(ctx);
}