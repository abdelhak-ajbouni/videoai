#!/usr/bin/env node

const { execSync } = require('child_process');

const mode = process.argv[2];

if (!mode || !['dev', 'prod'].includes(mode)) {
  console.log('🚀 VideoAI Mode Switcher');
  console.log('');
  console.log('Usage: node scripts/toggle-mode.js <mode>');
  console.log('');
  console.log('Modes:');
  console.log('  dev   - Development mode (mocked video generation)');
  console.log('  prod  - Production mode (real Replicate API)');
  console.log('');
  console.log('Current mode:');
  try {
    const envs = execSync('npx convex env list', { encoding: 'utf8' });
    const devMode = envs.includes('DEVELOPMENT_MODE=true');
    console.log(`  🎭 ${devMode ? 'Development' : 'Production'} Mode`);
  } catch (error) {
    console.log('  ❌ Could not determine current mode');
  }
  process.exit(1);
}

try {
  const isDev = mode === 'dev';

  console.log(`🔄 Switching to ${isDev ? 'Development' : 'Production'} mode...`);

  execSync(`npx convex env set DEVELOPMENT_MODE ${isDev}`, { stdio: 'inherit' });

  console.log('');
  console.log('✅ Mode switched successfully!');
  console.log('');

  if (isDev) {
    console.log('🎭 Development Mode Features:');
    console.log('  • Mock video generation (no Replicate costs)');
    console.log('  • Realistic timing simulation');
    console.log('  • Progressive status updates');
    console.log('  • 5% random failure rate for testing');
    console.log('  • Quality-based sample videos');
    console.log('  • Complete metadata simulation');
  } else {
    console.log('🚀 Production Mode Features:');
    console.log('  • Real Replicate API video generation');
    console.log('  • Google Veo-3 model');
    console.log('  • Actual video generation costs apply');
    console.log('  • High-quality AI-generated videos');
    console.log('');
    console.log('⚠️  Make sure you have Replicate credits:');
    console.log('   https://replicate.com/account/billing#billing');
  }

} catch (error) {
  console.error('❌ Failed to switch mode:', error.message);
  process.exit(1);
} 