import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createJobPoller } from '../lib/job-poller.mjs';

function createFakeTimers() {
  let nextId = 0;
  const timers = new Map();
  return {
    setTimer(callback, delay) {
      const id = ++nextId;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimer(id) {
      timers.delete(id);
    },
    async runNext() {
      const entry = timers.entries().next().value;
      assert.ok(entry, 'expected a scheduled timer');
      const [id, timer] = entry;
      timers.delete(id);
      timer.callback();
      await Promise.resolve();
      await Promise.resolve();
    },
    get size() {
      return timers.size;
    },
    get delays() {
      return [...timers.values()].map(({ delay }) => delay);
    }
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test('one sequential polling loop runs per job and never overlaps requests', async () => {
  const timers = createFakeTimers();
  const firstRequest = deferred();
  let requestCount = 0;
  let activeRequests = 0;
  let maximumActiveRequests = 0;
  const poller = createJobPoller({
    intervalMs: 1500,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    fetchJob: async () => {
      requestCount += 1;
      activeRequests += 1;
      maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
      if (requestCount === 1) {
        await firstRequest.promise;
      }
      activeRequests -= 1;
      return { id: 'job-1', status: 'processing', progress: 10 };
    },
    onJob() {},
    onError(error) { throw error; }
  });

  assert.equal(poller.start('job-1'), true);
  assert.equal(timers.delays[0], 1500);
  assert.equal(poller.start('job-1'), false);
  assert.equal(timers.size, 1);
  await timers.runNext();
  assert.equal(requestCount, 1);
  assert.equal(timers.size, 0);

  firstRequest.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(timers.size, 1);
  assert.equal(timers.delays[0], 2250);
  await timers.runNext();
  assert.equal(requestCount, 2);
  assert.equal(maximumActiveRequests, 1);
  poller.stop();
  assert.equal(timers.size, 0);
});

test('polling backs off for long-running jobs and respects the maximum interval', async () => {
  const timers = createFakeTimers();
  const poller = createJobPoller({
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    fetchJob: async () => ({ id: 'long-job', status: 'processing' }),
    onJob() {},
    onError(error) { throw error; }
  });

  poller.start('long-job');
  assert.equal(timers.delays[0], 1500);
  await timers.runNext();
  assert.equal(timers.delays[0], 2250);
  await timers.runNext();
  assert.equal(timers.delays[0], 3375);
  await timers.runNext();
  assert.equal(timers.delays[0], 5000);
  await timers.runNext();
  assert.equal(timers.delays[0], 5000);
  poller.stop();
});

for (const status of ['completed', 'failed', 'cancelled']) {
  test(`polling stops immediately on ${status}`, async () => {
    const timers = createFakeTimers();
    const updates = [];
    let requestCount = 0;
    const poller = createJobPoller({
      setTimer: timers.setTimer,
      clearTimer: timers.clearTimer,
      fetchJob: async () => {
        requestCount += 1;
        return { id: 'job-terminal', status };
      },
      onJob: (job) => updates.push(job),
      onError(error) { throw error; }
    });

    poller.start('job-terminal');
    await timers.runNext();
    assert.equal(requestCount, 1);
    assert.deepEqual(updates, [{ id: 'job-terminal', status }]);
    assert.equal(timers.size, 0);
    assert.equal(poller.start('job-terminal'), true);
    poller.stop();
  });
}

test('cancellation clears timers and aborts the in-flight status request', async () => {
  const timers = createFakeTimers();
  let requestSignal;
  let updates = 0;
  let errors = 0;
  const poller = createJobPoller({
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    fetchJob: (_id, { signal }) => {
      requestSignal = signal;
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      });
    },
    onJob() { updates += 1; },
    onError() { errors += 1; }
  });

  poller.start('job-cancel');
  await timers.runNext();
  assert.equal(requestSignal.aborted, false);
  assert.equal(poller.stop('job-cancel'), true);
  assert.equal(requestSignal.aborted, true);
  await Promise.resolve();
  assert.equal(timers.size, 0);
  assert.equal(updates, 0);
  assert.equal(errors, 0);
});

test('a late response from a replaced job cannot overwrite the current job', async () => {
  const timers = createFakeTimers();
  const oldRequest = deferred();
  const updates = [];
  const poller = createJobPoller({
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    fetchJob: (id) => id === 'old-job'
      ? oldRequest.promise
      : Promise.resolve({ id, status: 'completed' }),
    onJob: (job) => updates.push(job.id),
    onError(error) { throw error; }
  });

  poller.start('old-job');
  await timers.runNext();
  assert.equal(poller.start('new-job'), true);
  oldRequest.resolve({ id: 'old-job', status: 'completed' });
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(updates, []);
  await timers.runNext();
  assert.deepEqual(updates, ['new-job']);
  assert.equal(timers.size, 0);
});
