# VideoAI Configuration Management System

## Overview

The VideoAI Configuration Management System provides a centralized, database-driven approach to managing all system configurations. This replaces the previous hardcoded values scattered across multiple files with a flexible, admin-controlled configuration system.

## 🎯 Benefits

- **Centralized Management**: All configurations in one place
- **Runtime Updates**: Change settings without code deployments
- **Admin Interface**: Visual configuration management
- **Type Safety**: Strongly typed configuration values
- **Validation**: Built-in constraints and validation
- **Audit Trail**: Track configuration changes over time
- **Fallback Support**: Graceful degradation with default values

## 🏗️ Architecture

### Database Schema

The `configurations` table stores all system configurations with the following structure:

```typescript
{
  key: string,                    // Unique configuration key
  category: string,               // "pricing", "models", "business", etc.
  name: string,                   // Human-readable name
  description?: string,           // Description of the configuration
  value: any,                     // Configuration value (typed)
  dataType: "string" | "number" | "boolean" | "array" | "object",
  isActive: boolean,              // Whether this config is active
  isEditable: boolean,            // Whether admins can edit this
  minValue?: number,              // Validation constraints
  maxValue?: number,
  allowedValues?: string[],       // Allowed values for enums
  createdAt: number,
  updatedAt: number,
}
```

### Configuration Categories

1. **Business Settings** (`business`)
   - Profit margins
   - Credit conversion rates
   - Free tier allocations

2. **Pricing & Costs** (`pricing`)
   - Quality multipliers
   - Model pricing
   - Cost calculations

3. **AI Models** (`models`)
   - Model configurations
   - Supported durations
   - Model capabilities

4. **Feature Flags** (`features`)
   - Feature toggles
   - System capabilities
   - Experimental features

5. **System Limits** (`limits`)
   - Rate limits
   - Size constraints
   - Usage limits

6. **Subscription Settings** (`subscriptions`)
   - Quality access by tier
   - Feature access control
   - Subscription limits

## 🚀 Getting Started

### 1. Initialize Configuration System

```bash
# Initialize default configurations
npm run init-configs
```

This will create all default configurations in the database.

### 2. Access Admin Interface

Navigate to `/admin/configurations` to access the configuration management interface.

### 3. Update Configurations

Use the admin interface to modify configurations in real-time.

## 📋 Default Configurations

### Business Settings

| Key | Value | Description |
|-----|-------|-------------|
| `profit_margin` | 1.32 | 32% markup on all transactions |
| `credits_per_dollar` | 50 | $0.02 per credit conversion rate |
| `free_tier_credits` | 10 | Initial credits for new users |

### Pricing Multipliers

| Quality | Multiplier | Description |
|---------|------------|-------------|
| Standard | 1.0x | Base pricing |
| High | 1.2x | 20% premium |
| Ultra | 1.5x | 50% premium |

### AI Model Configurations

#### Google Veo-3 (Premium)
- **Cost**: $0.75/second
- **Duration**: Fixed 8 seconds
- **Quality**: All tiers supported
- **Use Case**: High-quality professional videos

#### Luma Ray-2-720p (Budget)
- **Cost**: $0.18/second
- **Duration**: 5s or 9s options
- **Quality**: All tiers supported
- **Use Case**: Cost-effective content creation

#### Luma Ray Flash 2-540p (Default)
- **Cost**: $0.12/second
- **Duration**: 5s or 9s options
- **Quality**: All tiers supported
- **Use Case**: Ultra-fast, ultra-cheap generation

### Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `enable_ultra_quality` | true | Enable ultra quality tier |
| `enable_priority_processing` | true | Enable priority processing for Pro/Business |
| `enable_api_access` | true | Enable API access for Business users |

### System Limits

| Limit | Value | Description |
|-------|-------|-------------|
| `max_prompt_length` | 500 | Maximum characters in video prompts |
| `max_concurrent_generations` | 3 | Max simultaneous video generations per user |
| `max_video_duration` | 60 | Maximum video duration in seconds |

## 🔧 API Usage

### Reading Configurations

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Get specific configuration
const profitMargin = useQuery(api.configurations.getConfig, { 
  key: "profit_margin" 
});

// Get all configurations by category
const businessConfigs = useQuery(api.configurations.getConfigsByCategory, { 
  category: "business" 
});

// Get all active configurations
const allConfigs = useQuery(api.configurations.getAllConfigs);
```

### Updating Configurations

```typescript
import { useMutation } from "convex/react";

const updateConfig = useMutation(api.configurations.updateConfig);

// Update a configuration
await updateConfig({
  key: "profit_margin",
  value: 1.35, // New 35% markup
});
```

### Helper Functions

```typescript
// Get business configuration
const businessConfig = useQuery(api.configurations.getBusinessConfig);

// Get model configuration
const modelConfig = useQuery(api.configurations.getModelConfig, { 
  modelId: "google/veo-3" 
});

// Get all model configurations
const allModels = useQuery(api.configurations.getAllModelConfigs);
```

## 🛡️ Security & Validation

### Access Control

- Only authenticated users can access the admin interface
- Configuration updates require proper permissions
- All changes are logged with timestamps

### Validation

- **Type Safety**: Configurations are strongly typed
- **Range Validation**: Numeric values have min/max constraints
- **Enum Validation**: String values can be restricted to allowed values
- **Required Fields**: Critical configurations cannot be deleted

### Fallback Strategy

If configurations are not found in the database, the system falls back to hardcoded defaults:

```typescript
// Example fallback in pricing calculation
const profitMargin = profitMarginConfig?.value as number || 1.32;
const creditsPerDollar = creditsPerDollarConfig?.value as number || 50;
```

## 📊 Monitoring & Analytics

### Configuration Changes

Track configuration changes over time:

```typescript
// Get configuration history
const configHistory = await ctx.db
  .query("configurations")
  .withIndex("by_key", (q) => q.eq("key", "profit_margin"))
  .order("desc")
  .collect();
```

### Impact Analysis

Monitor the impact of configuration changes:

- Credit usage patterns
- Revenue impact
- User behavior changes
- System performance metrics

## 🔄 Migration from Hardcoded Values

### Before (Hardcoded)

```typescript
// Old approach - hardcoded in pricing.ts
const config = {
  profitMargin: 1.32,
  creditsPerDollar: 50,
  qualityMultipliers: {
    standard: 1.0,
    high: 1.2,
    ultra: 1.5,
  }
};
```

### After (Database-Driven)

```typescript
// New approach - database-driven
const businessConfig = await getBusinessConfig(ctx, {});
const profitMargin = businessConfig.profitMargin;
const creditsPerDollar = businessConfig.creditsPerDollar;
```

## 🚨 Best Practices

### Configuration Management

1. **Use Descriptive Keys**: Choose clear, hierarchical keys
2. **Document Changes**: Always update descriptions when changing configs
3. **Test Changes**: Validate configurations in staging first
4. **Monitor Impact**: Track the effects of configuration changes
5. **Backup Defaults**: Keep fallback values for critical configurations

### Performance Considerations

1. **Cache Configurations**: Cache frequently accessed configurations
2. **Batch Updates**: Update related configurations together
3. **Lazy Loading**: Load configurations only when needed
4. **Index Optimization**: Use proper database indexes for queries

### Security Guidelines

1. **Validate Inputs**: Always validate configuration values
2. **Access Control**: Restrict configuration access to authorized users
3. **Audit Logging**: Log all configuration changes
4. **Encryption**: Consider encrypting sensitive configurations

## 🔮 Future Enhancements

### Planned Features

1. **Configuration Versioning**: Track configuration history and rollback
2. **Environment-Specific Configs**: Different configs for dev/staging/prod
3. **Configuration Templates**: Predefined configuration sets
4. **Bulk Operations**: Update multiple configurations at once
5. **Configuration Dependencies**: Handle interdependent configurations
6. **Real-time Notifications**: Alert on critical configuration changes

### Integration Opportunities

1. **Feature Flags**: Integrate with feature flag management systems
2. **A/B Testing**: Support for configuration-based A/B testing
3. **Analytics Integration**: Connect configuration changes to metrics
4. **CI/CD Integration**: Automated configuration validation in pipelines

## 📞 Support

For questions about the configuration system:

1. Check the admin interface at `/admin/configurations`
2. Review this documentation
3. Check the database schema in `convex/schema.ts`
4. Examine the configuration functions in `convex/configurations.ts`

## 🎉 Conclusion

The Configuration Management System provides a robust, flexible foundation for managing VideoAI's system settings. It eliminates the need for code deployments to change business logic and provides administrators with powerful tools to optimize the platform's performance and user experience. 