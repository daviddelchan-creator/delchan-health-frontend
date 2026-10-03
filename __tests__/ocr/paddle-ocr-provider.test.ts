import { PaddleOCRProvider } from '../../utils/ocr/paddle-ocr-provider';
import * as child_process from 'child_process';
import { EventEmitter } from 'events';

jest.mock('child_process');

describe('PaddleOCRProvider Node<->Python Protocol Tests', () => {
    let provider: PaddleOCRProvider;

    beforeEach(() => {
        provider = new PaddleOCRProvider();
        jest.clearAllMocks();
    });

    it('should parse valid JSON output successfully', async () => {
        const mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.stdin = { write: jest.fn(), end: jest.fn() };

        (child_process.spawn as jest.Mock).mockReturnValue(mockProcess);

        const promise = provider.processDocument({ filePath: 'dummy.pdf', mimeType: 'application/pdf' });

        mockProcess.stdout.emit('data', JSON.stringify({
            pages: [ { page: 1, lines: [] } ]
        }));

        mockProcess.emit('close', 0);

        const result = await promise;
        expect(result.pages).toBeDefined();
        expect(result.pageCount).toBe(1);
    });

    it('should reject when worker returns invalid JSON', async () => {
        const mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.stdin = { write: jest.fn(), end: jest.fn() };

        (child_process.spawn as jest.Mock).mockReturnValue(mockProcess);

        const promise = provider.processDocument({ filePath: 'dummy.pdf', mimeType: 'application/pdf' });

        mockProcess.stdout.emit('data', 'Not a JSON { oops }');
        mockProcess.emit('close', 0);

        await expect(promise).rejects.toThrow('Failed to parse PaddleOCR output as JSON');
    });

    it('should reject when output is empty', async () => {
        const mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.stdin = { write: jest.fn(), end: jest.fn() };

        (child_process.spawn as jest.Mock).mockReturnValue(mockProcess);

        const promise = provider.processDocument({ filePath: 'dummy.pdf', mimeType: 'application/pdf' });

        mockProcess.emit('close', 0);

        await expect(promise).rejects.toThrow('PaddleOCR process returned empty output');
    });

    it('should reject on non-zero exit code', async () => {
        const mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.stdin = { write: jest.fn(), end: jest.fn() };

        (child_process.spawn as jest.Mock).mockReturnValue(mockProcess);

        const promise = provider.processDocument({ filePath: 'dummy.pdf', mimeType: 'application/pdf' });

        mockProcess.stderr.emit('data', 'Fatal error occurred.');
        mockProcess.emit('close', 1);

        await expect(promise).rejects.toThrow('PaddleOCR process exited with code 1');
    });

    it('should reject if JSON does not contain pages array', async () => {
        const mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.stdin = { write: jest.fn(), end: jest.fn() };

        (child_process.spawn as jest.Mock).mockReturnValue(mockProcess);

        const promise = provider.processDocument({ filePath: 'dummy.pdf', mimeType: 'application/pdf' });

        mockProcess.stdout.emit('data', JSON.stringify({ something: "else" }));
        mockProcess.emit('close', 0);

        await expect(promise).rejects.toThrow('Invalid JSON structure returned by PaddleOCR');
    });
});
