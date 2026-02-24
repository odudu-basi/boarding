import { API } from './api';
import { AnalyticsEvent } from './types';

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 10000; // 10 seconds

export class AnalyticsManager {
  private api: API;
  private events: AnalyticsEvent[] = [];
  private userId: string;
  private sessionId: string;
  private flushTimer: NodeJS.Timeout | null = null;
  private experimentId: string | null = null;
  private variantId: string | null = null;

  constructor(api: API, userId: string, sessionId: string) {
    this.api = api;
    this.userId = userId;
    this.sessionId = sessionId;

    // Start auto-flush timer
    this.startFlushTimer();
  }

  /**
   * Set experiment context — all subsequent events will be tagged
   */
  setExperimentContext(experimentId: string, variantId: string): void {
    this.experimentId = experimentId;
    this.variantId = variantId;
  }

  /**
   * Track an analytics event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    const mergedProperties: Record<string, any> = {
      ...(properties || {}),
    };

    // Auto-inject experiment context if set
    if (this.experimentId) {
      mergedProperties.experiment_id = this.experimentId;
    }
    if (this.variantId) {
      mergedProperties.variant_id = this.variantId;
    }

    const event: AnalyticsEvent = {
      event: eventName,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: Date.now(),
      properties: mergedProperties,
    };

    this.events.push(event);

    // Auto-flush if batch size reached
    if (this.events.length >= BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Manually flush events to backend
   */
  async flush(): Promise<void> {
    if (this.events.length === 0) {
      return;
    }

    // Take current events and clear queue
    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await this.api.trackEvents(eventsToSend);
      console.log(`Flushed ${eventsToSend.length} events`);
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Put events back in queue to retry later
      this.events.unshift(...eventsToSend);
    }
  }

  /**
   * Start auto-flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, FLUSH_INTERVAL_MS);
  }

  /**
   * Stop auto-flush timer and flush remaining events
   */
  async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}
