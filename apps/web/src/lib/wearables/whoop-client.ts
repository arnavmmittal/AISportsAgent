/**
 * WHOOP API Client
 *
 * Handles OAuth authentication and data fetching from WHOOP API
 * See: https://developer.whoop.com/api
 */

const WHOOP_API_URL = 'https://api.prod.whoop.com/developer/v1';
const WHOOP_OAUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2';

export interface WHOOPTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface WHOOPUser {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface WHOOPSleepData {
  id: number;
  user_id: number;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number;
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  };
}

export interface WHOOPRecoveryData {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number;
    skin_temp_celsius: number;
  };
}

export interface WHOOPWorkoutData {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: string;
  score: {
    strain: number;
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter?: number;
    altitude_gain_meter?: number;
    altitude_change_meter?: number;
    zone_duration: {
      zone_zero_milli: number;
      zone_one_milli: number;
      zone_two_milli: number;
      zone_three_milli: number;
      zone_four_milli: number;
      zone_five_milli: number;
    };
  };
}

export interface WHOOPCycleData {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  score_state: string;
  score: {
    strain: number;
    kilojoule: number;
    average_heart_rate: number;
    max_heart_rate: number;
  };
}

class WHOOPClient {
  private baseUrl = WHOOP_API_URL;

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<WHOOPTokens> {
    const clientId = process.env.WHOOP_CLIENT_ID;
    const clientSecret = process.env.WHOOP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('WHOOP credentials not configured');
    }

    const response = await fetch(`${WHOOP_OAUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WHOOP token exchange failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh access token
   */
  async refreshTokens(refreshToken: string): Promise<WHOOPTokens> {
    const clientId = process.env.WHOOP_CLIENT_ID;
    const clientSecret = process.env.WHOOP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('WHOOP credentials not configured');
    }

    const response = await fetch(`${WHOOP_OAUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WHOOP token refresh failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    accessToken: string,
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('WHOOP_TOKEN_EXPIRED');
      }
      const error = await response.text();
      throw new Error(`WHOOP API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get user profile
   */
  async getUser(accessToken: string): Promise<WHOOPUser> {
    const response = await this.request<{ user_id: number; email: string; first_name: string; last_name: string }>(
      accessToken,
      '/user/profile/basic'
    );
    return response;
  }

  /**
   * Get sleep data for date range
   */
  async getSleep(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<WHOOPSleepData[]> {
    const response = await this.request<{ records: WHOOPSleepData[] }>(
      accessToken,
      '/activity/sleep',
      {
        start: startDate,
        end: endDate,
      }
    );
    return response.records || [];
  }

  /**
   * Get recovery data for date range
   */
  async getRecovery(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<WHOOPRecoveryData[]> {
    const response = await this.request<{ records: WHOOPRecoveryData[] }>(
      accessToken,
      '/recovery',
      {
        start: startDate,
        end: endDate,
      }
    );
    return response.records || [];
  }

  /**
   * Get workout data for date range
   */
  async getWorkouts(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<WHOOPWorkoutData[]> {
    const response = await this.request<{ records: WHOOPWorkoutData[] }>(
      accessToken,
      '/activity/workout',
      {
        start: startDate,
        end: endDate,
      }
    );
    return response.records || [];
  }

  /**
   * Get physiological cycles for date range
   */
  async getCycles(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<WHOOPCycleData[]> {
    const response = await this.request<{ records: WHOOPCycleData[] }>(
      accessToken,
      '/cycle',
      {
        start: startDate,
        end: endDate,
      }
    );
    return response.records || [];
  }
}

export const whoopClient = new WHOOPClient();
export default whoopClient;
