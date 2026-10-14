const { performance } = require('perf_hooks');

const docRefs = Array.from({ length: 50 }).map((_, i) => ({
  id: `doc-${i}`,
  date: new Date().toISOString(),
  description: `Doc ${i}`,
  content: [{ attachment: { url: `Binary/bin-${i}`, contentType: 'text/html' } }]
}));

// Mock medplum
const medplum = {
  readResource: async (type, id) => {
    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms latency
    return { data: 'MOCK_BASE64_DATA' };
  }
};

async function sequential() {
  const parsedItems = [];
  const start = performance.now();
  for (const doc of docRefs) {
    let resolvedHtml = undefined;
    const binaryAttachment = doc.content?.find((c) => c.attachment?.contentType?.includes('html') || c.attachment?.url?.includes('Binary/'));
    if (binaryAttachment?.attachment?.url?.includes('Binary/')) {
      const binaryId = binaryAttachment.attachment.url.split('Binary/')[1];
      try {
        const binary = await medplum.readResource('Binary', binaryId);
        if (binary?.data) {
          resolvedHtml = Buffer.from(binary.data, 'base64').toString('utf8');
        }
      } catch {}
    }
    parsedItems.push({
      id: doc.id,
      htmlContent: resolvedHtml
    });
  }
  const end = performance.now();
  return { time: end - start, parsedItems };
}

async function parallel() {
  const start = performance.now();
  const promises = docRefs.map(async (doc) => {
    let resolvedHtml = undefined;
    const binaryAttachment = doc.content?.find((c) => c.attachment?.contentType?.includes('html') || c.attachment?.url?.includes('Binary/'));
    if (binaryAttachment?.attachment?.url?.includes('Binary/')) {
      const binaryId = binaryAttachment.attachment.url.split('Binary/')[1];
      try {
        const binary = await medplum.readResource('Binary', binaryId);
        if (binary?.data) {
          resolvedHtml = Buffer.from(binary.data, 'base64').toString('utf8');
        }
      } catch {}
    }
    return {
      id: doc.id,
      htmlContent: resolvedHtml
    };
  });
  const parsedItems = await Promise.all(promises);
  const end = performance.now();
  return { time: end - start, parsedItems };
}

async function run() {
  console.log('Running sequential...');
  const seqRes = await sequential();
  console.log(`Sequential time: ${seqRes.time.toFixed(2)}ms`);

  console.log('Running parallel...');
  const parRes = await parallel();
  console.log(`Parallel time: ${parRes.time.toFixed(2)}ms`);
}

run();
