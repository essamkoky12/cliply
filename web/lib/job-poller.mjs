const ACTIVE_STATUSES = new Set(['queued', 'processing']);

export function createJobPoller({
  fetchJob,
  onJob,
  onError,
  intervalMs = 1500,
  maxIntervalMs = 5000,
  backoffFactor = 1.5,
  setTimer = setTimeout,
  clearTimer = clearTimeout
}) {
  let active = null;

  function stop(jobId) {
    if (!active || (jobId && active.jobId !== jobId)) return false;
    const current = active;
    active = null;
    if (current.timer !== null) clearTimer(current.timer);
    current.controller?.abort();
    return true;
  }

  function start(jobId) {
    if (!jobId) return false;
    if (active?.jobId === jobId) return false;
    stop();

    const current = { jobId, timer: null, controller: null, intervalMs };
    active = current;

    function schedule() {
      if (active !== current) return;
      current.timer = setTimer(poll, current.intervalMs);
    }

    async function poll() {
      if (active !== current) return;
      current.timer = null;
      const controller = new AbortController();
      current.controller = controller;
      try {
        const job = await fetchJob(jobId, { signal: controller.signal });
        if (active !== current || controller.signal.aborted) return;
        if (!ACTIVE_STATUSES.has(job.status)) {
          active = null;
          current.controller = null;
          onJob(job);
          return;
        }
        onJob(job);
        current.intervalMs = Math.min(maxIntervalMs, current.intervalMs * backoffFactor);
        schedule();
      } catch (error) {
        if (active !== current || controller.signal.aborted) return;
        active = null;
        current.controller = null;
        onError(error);
      }
    }

    schedule();
    return true;
  }

  return { start, stop };
}
