#!/usr/bin/env node

/**
 * Generate Apple OAuth Secret Key for Supabase
 *
 * This script generates a JWT token required for Apple Sign In OAuth flow.
 * The token is valid for 6 months and needs to be regenerated periodically.
 *
 * Usage:
 *   node scripts/generate-apple-secret.js
 */

const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🍎 Apple OAuth Secret Generator\n');
  console.log('This will generate the JWT token needed for Supabase Apple Sign In.\n');

  try {
    // Get inputs from user
    const teamId = await question('Enter your Apple Team ID (10 characters): ');
    const keyId = await question('Enter your Key ID: ');
    const serviceId = await question('Enter your Service ID (e.g., com.yourname.f1fantasy): ');
    const keyFilePath = await question('Enter the path to your .p8 key file: ');

    // Validate inputs
    if (!teamId || !keyId || !serviceId || !keyFilePath) {
      console.error('\n❌ Error: All fields are required.');
      rl.close();
      return;
    }

    // Read the private key file
    const resolvedPath = path.resolve(keyFilePath.trim());

    if (!fs.existsSync(resolvedPath)) {
      console.error(`\n❌ Error: Key file not found at ${resolvedPath}`);
      rl.close();
      return;
    }

    const privateKey = fs.readFileSync(resolvedPath, 'utf8');

    // Generate JWT token
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 180 * 24 * 60 * 60; // 180 days (6 months)

    const payload = {
      iss: teamId.trim(),
      iat: now,
      exp: now + expiresIn,
      aud: 'https://appleid.apple.com',
      sub: serviceId.trim()
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      keyid: keyId.trim()
    });

    // Display results
    console.log('\n✅ Success! Here are your Apple OAuth configuration values:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Copy these values into Supabase:\n');
    console.log('Client ID (Service ID):');
    console.log(`  ${serviceId.trim()}\n`);
    console.log('Secret Key (JWT Token):');
    console.log(`  ${token}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const expiryDate = new Date((now + expiresIn) * 1000);
    console.log(`\n⏰ Token expires: ${expiryDate.toLocaleDateString()}`);
    console.log('   You will need to regenerate this token every 6 months.\n');

    // Save to file for reference
    const outputFile = path.join(__dirname, 'apple-oauth-secret.txt');
    const output = `Apple OAuth Configuration
Generated: ${new Date().toISOString()}
Expires: ${expiryDate.toISOString()}

Client ID (Service ID):
${serviceId.trim()}

Secret Key (JWT Token):
${token}

IMPORTANT: Keep this file secure and don't commit it to git!
This token expires in 6 months and needs to be regenerated.
`;

    fs.writeFileSync(outputFile, output);
    console.log(`💾 Configuration saved to: ${outputFile}`);
    console.log('   (This file is gitignored for security)\n');

  } catch (error) {
    console.error('\n❌ Error generating secret:', error.message);
    if (error.message.includes('PEM')) {
      console.error('\nMake sure your .p8 file is valid and properly formatted.');
    }
  } finally {
    rl.close();
  }
}

main();
