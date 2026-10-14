// No need to import axios if we are mocking it entirely

// Mock axios
const mockAxios = {
  get: async (url) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: { status: 'OCR_PENDING' } });
      }, 50); // Simulate 50ms network latency
    });
  }
};

const docs = Array.from({ length: 10 }).map((_, i) => ({ id: `doc_${i}` }));
const baseUrl = 'http://localhost';
const token = 'mock_token';

async function testSequential() {
  const start = performance.now();
  const states = {};
  for (const doc of docs) {
    try {
      const statRes = await mockAxios.get(`${baseUrl}/api/patient/documents/${doc.id}/processing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      states[doc.id] = statRes.data.status;
    } catch(e) {
      console.log('Failed to fetch status for doc', doc.id);
    }
  }
  const end = performance.now();
  return end - start;
}

async function testConcurrent() {
  const start = performance.now();
  const states = {};
  await Promise.all(docs.map(async (doc) => {
    try {
      const statRes = await mockAxios.get(`${baseUrl}/api/patient/documents/${doc.id}/processing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      states[doc.id] = statRes.data.status;
    } catch(e) {
      console.log('Failed to fetch status for doc', doc.id);
    }
  }));
  const end = performance.now();
  return end - start;
}

async function run() {
  console.log('Running sequential test...');
  const seqTime = await testSequential();
  console.log(`Sequential time: ${seqTime.toFixed(2)}ms`);

  console.log('Running concurrent test...');
  const concTime = await testConcurrent();
  console.log(`Concurrent time: ${concTime.toFixed(2)}ms`);

  console.log(`Improvement: ${((seqTime - concTime) / seqTime * 100).toFixed(2)}% faster`);
}

run();
