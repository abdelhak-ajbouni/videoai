#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🤖 Initializing VideoAI Model Management System...\n');

try {
  // Initialize default models
  console.log('📋 Setting up default AI models...');
  execSync('npx convex run models:initializeDefaultModels', { stdio: 'inherit' });

  console.log('\n✅ Default models initialized successfully!');

  console.log('\n🤖 AI Models Available:');
  console.log('  • Google Veo-3 (Premium) - High-quality video generation');
  console.log('  • Luma Ray-2-720p (Budget) - Fast, cost-effective generation');
  console.log('  • Luma Ray Flash 2-540p (Default) - Ultra-fast, ultra-cheap');

  console.log('\n📊 Model Categories:');
  console.log('  • Premium: High-quality models for professional use');
  console.log('  • Budget: Cost-effective models for content creation');
  console.log('  • Experimental: New and experimental models');

  console.log('\n🎛️  Model Features:');
  console.log('  • Dynamic pricing based on cost per second');
  console.log('  • Flexible duration support (5s, 8s, 9s)');
  console.log('  • Quality tier support (Standard, High, Ultra)');
  console.log('  • Model versioning and deprecation support');
  console.log('  • Usage statistics and performance tracking');
  console.log('  • Provider and category organization');

  console.log('\n🚀 Model management system is ready!');
  console.log('   You can now manage models via the admin interface or database.');

} catch (error) {
  console.error('❌ Failed to initialize models:', error.message);
  process.exit(1);
} 