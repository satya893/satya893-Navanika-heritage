async function mockSequential() {
  const start = performance.now();
  await new Promise(resolve => setTimeout(resolve, 300));
  await new Promise(resolve => setTimeout(resolve, 500));
  await new Promise(resolve => setTimeout(resolve, 200));
  const end = performance.now();
  return end - start;
}

async function mockConcurrent() {
  const start = performance.now();
  await Promise.all([
    new Promise(resolve => setTimeout(resolve, 300)),
    new Promise(resolve => setTimeout(resolve, 500)),
    new Promise(resolve => setTimeout(resolve, 200))
  ]);
  const end = performance.now();
  return end - start;
}

async function run() {
  let seqTotal = 0;
  let conTotal = 0;
  const runs = 5;

  for (let i = 0; i < runs; i++) {
    seqTotal += await mockSequential();
    conTotal += await mockConcurrent();
  }

  const seqAvg = seqTotal / runs;
  const conAvg = conTotal / runs;

  console.log(`Average Sequential Time (mock network delays 300ms, 500ms, 200ms): ${seqAvg.toFixed(2)}ms`);
  console.log(`Average Concurrent Time (mock network delays 300ms, 500ms, 200ms): ${conAvg.toFixed(2)}ms`);
  console.log(`Theoretical Improvement: ${((seqAvg - conAvg) / seqAvg * 100).toFixed(2)}% faster`);
}

run();
