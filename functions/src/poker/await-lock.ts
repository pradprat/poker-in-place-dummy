/**
 * A mutex lock for coordination across async functions
 */
export default class AwaitLock {
  private _acquired: boolean = false;
  private _waitingResolvers: (() => void)[] = [];

  /**
   * Whether the lock is currently acquired or not. Accessing this property does not affect the
   * status of the lock.
   */
  get acquired(): boolean {
    return this._acquired;
  }

  /**
   * Acquires the lock, waiting if necessary for it to become free if it is already locked. The
   * returned promise is fulfilled once the lock is acquired.
   *
   * After acquiring the lock, you **must** call `release` when you are done with it.
   */
  acquireAsync(options: { timeout?: number } = {}): Promise<void> {
    if (!this._acquired) {
      console.log("first lock");
      this._acquired = true;
      return Promise.resolve();
    }

    const canceller = { cancelled: false, fulilled: false };
    const lockPromise: Promise<void> = new Promise((resolve, reject) => {
      console.log("lockPromise");
      if (!canceller.cancelled) {
        canceller.fulilled = true;
        this._waitingResolvers.push(resolve);
      }
    });
    if (options.timeout) {
      const timeoutPromise: Promise<void> = new Promise((resolve, reject) => {
        setTimeout(() => {
          canceller.cancelled = true;
          reject("Timeout waiting for lock acquisition");
        }, options.timeout);
      });
      return Promise.race([lockPromise, timeoutPromise]);
    }
    return lockPromise;
  }

  /**
   * Acquires the lock if it is free and otherwise returns immediately without waiting. Returns
   * `true` if the lock was free and is now acquired, and `false` otherwise,
   */
  tryAcquire(): boolean {
    if (!this._acquired) {
      this._acquired = true;
      return true;
    }

    return false;
  }

  /**
   * Releases the lock and gives it to the next waiting acquirer, if there is one. Each acquirer
   * must release the lock exactly once.
   */
  release(): void {
    if (!this._acquired) {
      throw new Error(`Cannot release an unacquired lock`);
    }

    if (this._waitingResolvers.length > 0) {
      const resolve = this._waitingResolvers.shift()!;
      resolve();
    } else {
      this._acquired = false;
    }
  }
}
