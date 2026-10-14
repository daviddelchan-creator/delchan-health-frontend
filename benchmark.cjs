const { performance } = require('perf_hooks');

const tasks = Array.from({ length: 5 }, (_, i) => ({ id: i, description: `Task ${i}` }));

const mockUpdateResource = async (task) => {
  return new Promise((resolve) => setTimeout(resolve, 100)); // Simulate 100ms network latency
};

async function runSequential() {
  const start = performance.now();
  for (const t of tasks) {
    await mockUpdateResource({
      ...t,
      status: 'ready',
      businessStatus: { text: 'anamnese_concluida' },
      description: `${t.description || 'Lead CRM'} [Ficha Pré-Atendimento Preenchida & Consentimento Assinado]`
    }).catch(() => null);
  }
  const end = performance.now();
  return end - start;
}

async function runConcurrent() {
  const start = performance.now();
  await Promise.all(
    tasks.map((t) =>
      mockUpdateResource({
        ...t,
        status: 'ready',
        businessStatus: { text: 'anamnese_concluida' },
        description: `${t.description || 'Lead CRM'} [Ficha Pré-Atendimento Preenchida & Consentimento Assinado]`
      }).catch(() => null)
    )
  );
  const end = performance.now();
  return end - start;
}

async function runBenchmark() {
  console.log('Running sequential benchmark...');
  const seqTime = await runSequential();
  console.log(`Sequential time: ${seqTime.toFixed(2)}ms`);

  console.log('Running concurrent benchmark...');
  const conTime = await runConcurrent();
  console.log(`Concurrent time: ${conTime.toFixed(2)}ms`);

  console.log(`Improvement: ${((seqTime - conTime) / seqTime * 100).toFixed(2)}%`);
}

runBenchmark();
