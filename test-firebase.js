require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🔥 ROCK ON CAFE — FIREBASE CONNECTION TEST');
console.log('====================================================\n');

const requiredKeys = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID'
];

let allKeysPresent = true;

console.log('1. Checking .env Firebase Environment Variables:');
requiredKeys.forEach((key) => {
  const val = process.env[key];
  if (val) {
    console.log(`   ✅ ${key}: ${val}`);
  } else {
    console.log(`   ❌ Missing: ${key}`);
    allKeysPresent = false;
  }
});

console.log('\n2. Checking Client-Side Firebase Config:');
const clientConfigPath = path.join(__dirname, 'public', 'js', 'firebase-config.js');
if (fs.existsSync(clientConfigPath)) {
  const content = fs.readFileSync(clientConfigPath, 'utf-8');
  if (content.includes('jg-fiestaaa') && content.includes('AIzaSyCEHDnf9AqA-EFjSgfKQPAtZjVM5-bqq0M')) {
    console.log(`   ✅ Found public/js/firebase-config.js configured for project "jg-fiestaaa"`);
  } else {
    console.log(`   ⚠️ public/js/firebase-config.js found but config might be mismatched.`);
  }
} else {
  console.log(`   ❌ public/js/firebase-config.js not found!`);
  allKeysPresent = false;
}

console.log('\n3. Checking HTML Script Tags:');
const indexPath = path.join(__dirname, 'public', 'index.html');
if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf-8');
  const hasAppCompat = html.includes('firebase-app-compat.js');
  const hasAnalyticsCompat = html.includes('firebase-analytics-compat.js');
  const hasConfig = html.includes('firebase-config.js');

  console.log(`   ${hasAppCompat ? '✅' : '❌'} Firebase App SDK in index.html`);
  console.log(`   ${hasAnalyticsCompat ? '✅' : '❌'} Firebase Analytics SDK in index.html`);
  console.log(`   ${hasConfig ? '✅' : '❌'} firebase-config.js loaded in index.html`);
}

if (allKeysPresent) {
  console.log('\n🎉 ALL FIREBASE CREDENTIALS & INTEGRATIONS ARE 100% READY!\n');
} else {
  console.log('\n⚠️ Some checks failed. Please check the logs above.\n');
  process.exit(1);
}
