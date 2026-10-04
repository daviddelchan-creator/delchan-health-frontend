import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Magic Bytes Validation (Worker Simulation)', () => {
    // We will test the python logic via a simple script wrapper or just simulating the byte validation here to ensure it matches
    // the requirement. The actual python script is run via spawn.

    const runValidation = (mime: string, content: Buffer): Promise<any> => {
        return new Promise((resolve) => {
            const tempFile = path.join(__dirname, 'temp_test_file.bin');
            fs.writeFileSync(tempFile, content);

            const pyScript = `
import sys
import json
sys.path.append('${path.join(process.cwd(), 'scripts')}')
from paddle_ocr_worker import validate_magic_bytes

valid, err = validate_magic_bytes('${tempFile}', '${mime}')
print(json.dumps({"valid": valid, "error": err}))
`;

            const processCall = child_process.spawn('python3', ['-c', pyScript]);
            let out = '';
            processCall.stdout.on('data', d => out += d.toString());
            processCall.on('close', () => {
                fs.unlinkSync(tempFile);
                resolve(JSON.parse(out));
            });
        });
    };

    it('should validate correct PDF magic bytes', async () => {
        const content = Buffer.from('%PDF-1.4\n%...', 'utf-8');
        const res = await runValidation('application/pdf', content);
        expect(res.valid).toBe(true);
    });

    it('should reject invalid PDF magic bytes', async () => {
        const content = Buffer.from('NOT A PDF', 'utf-8');
        const res = await runValidation('application/pdf', content);
        expect(res.valid).toBe(false);
    });

    it('should validate correct PNG magic bytes', async () => {
        const content = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
        const res = await runValidation('image/png', content);
        expect(res.valid).toBe(true);
    });

    it('should validate correct JPEG magic bytes', async () => {
        const content = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
        const res = await runValidation('image/jpeg', content);
        expect(res.valid).toBe(true);
    });
});
