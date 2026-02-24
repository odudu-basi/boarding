import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OnboardingConfig,
  GetConfigResponse,
  AnalyticsEvent,
  TrackEventsResponse,
  AssignVariantResponse,
} from './types';

const CACHE_KEY = '@noboarding:config';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface CachedConfig {
  config: GetConfigResponse;
  timestamp: number;
}

export class API {
  private apiKey: string;
  private baseUrl: string;
  private supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobW16bXJzcHRlZ3ByZnp0cXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODM1MDUsImV4cCI6MjA4NjM1OTUwNX0.otIIs3ZyWTHTnDZ1NbZolzeHjWv__wmHekxZevhKryI';

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://hhmmzmrsptegprfztqtq.supabase.co/functions/v1';
  }

  /**
   * Fetch onboarding configuration from API
   */
  async getConfig(): Promise<GetConfigResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/get-config`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }

      const data: GetConfigResponse = await response.json();

      // Cache the config
      await this.cacheConfig(data);

      return data;
    } catch (error) {
      console.error('Error fetching config:', error);
      // Try to return cached config as fallback
      const cached = await this.getCachedConfig();
      if (cached) {
        console.log('Using cached config as fallback');
        return cached;
      }
      throw error;
    }
  }

  /**
   * Get cached configuration
   */
  async getCachedConfig(): Promise<GetConfigResponse | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) {
        return null;
      }

      const parsedCache: CachedConfig = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now - parsedCache.timestamp > CACHE_EXPIRY_MS) {
        await AsyncStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsedCache.config;
    } catch (error) {
      console.error('Error reading cached config:', error);
      return null;
    }
  }

  /**
   * Cache configuration locally
   */
  private async cacheConfig(config: GetConfigResponse): Promise<void> {
    try {
      const cacheData: CachedConfig = {
        config,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching config:', error);
    }
  }

  /**
   * Send analytics events to backend
   */
  async trackEvents(events: AnalyticsEvent[]): Promise<TrackEventsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/track-events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Failed to track events: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error tracking events:', error);
      throw error;
    }
  }

  /**
   * Get A/B test variant assignment
   */
  async assignVariant(
    experimentId: string,
    userId: string
  ): Promise<AssignVariantResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/assign-variant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experiment_id: experimentId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to assign variant: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error assigning variant:', error);
      throw error;
    }
  }

  /**
   * Clear cached config
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}
