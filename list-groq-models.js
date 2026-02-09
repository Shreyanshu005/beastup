const fs = require('fs');
const path = require('path');
const https = require('https');

// Read config
const configPath = path.join(process.env.HOME, 'Library/Application Support/Electron/config.json');
if (!fs.existsSync(configPath)) {
  console.error('Config not found at', configPath);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const apiKey = config.apiKey;

if (!apiKey) {
  console.error('No API key in config');
  process.exit(1);
}

console.log('Using API Key:', apiKey.substring(0, 10) + '...');

const options = {
  hostname: 'api.groq.com',
  path: '/openai/v1/models',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error('Error:', res.statusCode, data);
      return;
    }
    const models = JSON.parse(data);
    console.log('Available Models:');
    models.data.forEach(m => {
      console.log(`- ${m.id}`);
    });
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();
