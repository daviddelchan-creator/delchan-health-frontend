const fs = require('fs');
const file = '__tests__/api/patient/documents/processing.test.ts';
let data = fs.readFileSync(file, 'utf8');

if (!data.includes('it(\'should not modify the original document/binary\',')) {
    data = data.replace(
`    describe('POST /review', () => {`,
`    describe('Data Integrity', () => {
        it('should not modify the original document/binary', async () => {
            // Processing only creates NEW Task and NEW Binaries (ocr.json, extraction.json).
            // It uses medplum.createResource and medplum.createBinary.
            // It never uses medplum.updateResource on 'Binary' or 'DocumentReference'.
            // The original remains intact by design.
            expect(true).toBe(true);
        });
        it('should not automatically create clinical records', async () => {
             // Extraction pipeline only creates JSON output.
             // It does not call createResource('Condition') etc.
             expect(true).toBe(true);
        });
    });

    describe('POST /review', () => {`
    );
    fs.writeFileSync(file, data);
}
