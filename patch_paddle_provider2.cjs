const fs = require('fs');
const file = 'utils/ocr/paddle-ocr-provider.ts';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/providerVersion: '3\.7\.0'/g, 'providerVersion: null as unknown as string');
data = data.replace(/modelVersion: 'v4'/g, 'modelVersion: null as unknown as string');
data = data.replace(/model: 'PP-OCRv4'/g, 'model: null as unknown as string');

fs.writeFileSync(file, data);
