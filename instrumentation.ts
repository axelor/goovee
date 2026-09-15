export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Schedule the staged-upload reaper (non-blocking — just arms timers).
  const {startStagedUploadReaper} = await import('@/upload/startup');
  startStagedUploadReaper();

  // Report whether images can be resized. Never throws, never blocks startup.
  const {checkImageResizing} = await import('@/image/startup');
  void checkImageResizing();

  // Report whether mail can be delivered. Never throws, never blocks startup.
  const {checkMailTransport} = await import('@/notification/startup');
  void checkMailTransport();

  // Report whether push notifications can be sent.
  const {checkPushConfig} = await import('@/pwa/startup');
  checkPushConfig();

  /* Prepares every database and connects every tenant in the background, then
   * resumes the payment polling each tenant had pending when the server last
   * stopped. A database that is not reachable yet is retried with backoff, and
   * one tenant failing never holds up the rest. */
  const [{startTenants}, {resumeHubPispPolling}] = await Promise.all([
    import('@/tenant/startup'),
    import('@/payment/hubpisp/startup'),
  ]);

  startTenants(tenantId => resumeHubPispPolling({tenantId}));
}
