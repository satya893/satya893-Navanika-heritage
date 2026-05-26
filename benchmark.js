const { performance } = require('perf_hooks');

const simulateUpdateDoc = (delay) => new Promise(resolve => setTimeout(resolve, delay));

async function sequentialUpdates(items) {
    const start = performance.now();
    for (const item of items) {
        await simulateUpdateDoc(50); // Simulate network latency
    }
    await simulateUpdateDoc(50); // Final updateDoc
    const end = performance.now();
    return end - start;
}

async function parallelUpdates(items) {
    const start = performance.now();
    const promises = items.map(item => simulateUpdateDoc(50));
    promises.push(simulateUpdateDoc(50)); // Final updateDoc
    await Promise.all(promises);
    const end = performance.now();
    return end - start;
}

async function run() {
    const items = new Array(5).fill({}); // Simulate 5 items in an order
    const seqTime = await sequentialUpdates(items);
    console.log(`Sequential time: ${seqTime.toFixed(2)}ms`);

    const parTime = await parallelUpdates(items);
    console.log(`Parallel time: ${parTime.toFixed(2)}ms`);
}

run();
