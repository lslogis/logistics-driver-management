/**
 * Feature Flags Configuration and Guards
 * 
 * Client-side and server-side feature flag management
 * for controlled rollout and A/B testing capabilities.
 */

export interface FeatureFlags {
  rates: boolean;
  autoCalculation: boolean;
  // Add more features as needed
  [key: string]: boolean;
}

/**
 * Get feature flags from environment variables
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    rates: process.env.NEXT_PUBLIC_FEATURE_RATES === 'true',
    autoCalculation: process.env.NEXT_PUBLIC_FEATURE_AUTO_CALCULATION !== 'false', // Default ON
  };
}

/**
 * Server-side feature flag guard
 * Use this in API routes and server-side functions
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[flag];
}

/**
 * Client-side feature flag hook
 * Use this in React components and client-side code
 */
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[flag];
}

/**
 * Feature flag validation middleware for API routes
 */
export function validateFeatureFlag(flag: keyof FeatureFlags) {
  return (handler: any) => {
    return async (req: any, res: any) => {
      if (!isFeatureEnabled(flag)) {
        return res.status(404).json({
          ok: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: `Feature '${flag}' is currently disabled`
          }
        });
      }
      
      return handler(req, res);
    };
  };
}

/**
 * Development utilities
 */
export const FeatureFlagUtils = {
  /**
   * Log all current feature flags (development only)
   */
  logAllFlags() {
    if (process.env.NODE_ENV !== 'development') return;
    
    const flags = getFeatureFlags();
    console.group('🚩 Feature Flags Status');
    Object.entries(flags).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? '✅ Enabled' : '❌ Disabled'}`);
    });
    console.groupEnd();
  },

  /**
   * Get flag status for dashboard/admin UI
   */
  getAllFlags(): Record<string, boolean> {
    return getFeatureFlags();
  },

  /**
   * Check if any critical features are disabled
   */
  getCriticalDisabledFlags(): string[] {
    const flags = getFeatureFlags();
    const criticalFlags: string[] = ['rates']; // Define critical features
    const importantFlags: string[] = ['autoCalculation']; // Important but not critical
    
    return criticalFlags.filter(flag => !flags[flag as keyof FeatureFlags]);
  }
};