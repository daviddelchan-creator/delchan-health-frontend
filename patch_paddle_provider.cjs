const fs = require('fs');
const file = 'utils/ocr/paddle-ocr-provider.ts';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  "const pyProcess = spawn('python3', [scriptPath]);",
  `const pyProcess = spawn('python3', [scriptPath], { timeout: 60000 }); // 60 seconds timeout`
);

fs.writeFileSync(file, data);
