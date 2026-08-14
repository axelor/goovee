/* A backlog is normal and drains on its own, so this is not a limit — it is the
 * point at which one is worth saying out loud. Nothing else observes the queue,
 * and a server that cannot keep up shows up as memory rather than as an error. */
const BACKLOG_WARNING_THRESHOLD = 1_000;

// Stands in for a waiter already handed its slot; never called.
const NOOP = () => {};

/**
 * Bounds how many deliveries are in flight at once, so the work done before a
 * connection is asked for — encrypting, signing, building a message — follows the
 * slot count rather than the recipient count.
 */
export class DeliverySlots {
  private available: number;
  private waiting: Array<() => void> = [];
  /* A fan-out parks one waiter per recipient, so this queue is as long as the
   * recipient list — an index keeps release O(1) at that length. */
  private next = 0;
  private reportedBacklog = false;

  constructor(
    limit: number,
    private readonly describeBacklog: (queued: number) => string,
  ) {
    this.available = limit;
  }

  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }

    const queued = this.waiting.length - this.next + 1;

    if (!this.reportedBacklog && queued >= BACKLOG_WARNING_THRESHOLD) {
      this.reportedBacklog = true;
      console.warn(this.describeBacklog(queued));
    }

    await new Promise<void>(resolve => this.waiting.push(resolve));
  }

  /* Hands the slot to the next waiter rather than returning it, so a queued
   * delivery cannot be passed over. */
  release(): void {
    if (this.next < this.waiting.length) {
      const waiter = this.waiting[this.next];
      this.waiting[this.next] = NOOP;
      this.next++;

      if (this.next === this.waiting.length) {
        this.waiting = [];
        this.next = 0;
        this.reportedBacklog = false;
      }

      waiter();
      return;
    }

    this.available++;
  }
}
