#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 Initializing VideoAI Configuration System...\n');

try {
  // Initialize default configurations
  console.log('📋 Setting up default configurations...');
  execSync('npx convex run configurations:initializeDefaultConfigs', { stdio: 'inherit' });

  console.log('\n✅ Default configurations initialized successfully!');

  console.log('\n📊 Configuration Categories:');
  console.log('  • Business: Profit margins, credit conversion rates');
  console.log('  • Pricing: Quality multipliers, model costs');
  console.log('  • Models: AI model configurations and capabilities');
  console.log('  • Features: Feature flags and system settings');
  console.log('  • Limits: System limits and constraints');
  console.log('  • Subscriptions: Quality access by subscription tier');

  console.log('\n🎛️  Key Configurations:');
  console.log('  • profit_margin: 1.32 (32% markup)');
  console.log('  • credits_per_dollar: 50 ($0.02 per credit)');
  console.log('  • free_tier_credits: 10 (initial credits for new users)');
  console.log('  • quality_multipliers: Standard(1.0), High(1.2), Ultra(1.5)');
  console.log('  • model_configs: Complete AI model specifications');

  console.log('\n🚀 Configuration system is ready!');
  console.log('   You can now modify configurations via the admin interface or database.');

} catch (error) {
  console.error('❌ Failed to initialize configurations:', error.message);
  process.exit(1);
} 