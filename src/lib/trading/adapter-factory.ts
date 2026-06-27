import { TradingPlatform, type PlatformAdapter } from "./types";
import { TradovateAdapter } from "./tradovate";

/**
 * Platforms that are not yet supported. Users should not be able to
 * create accounts for these in the UI, but if they do, sync and
 * copy operations will return a clear error.
 */
export const UNSUPPORTED_PLATFORMS = new Set<TradingPlatform>([
  TradingPlatform.NINJATRADER,
  TradingPlatform.RITHMIC,
]);

export function createPlatformAdapter(platform: TradingPlatform): PlatformAdapter {
  switch (platform) {
    case TradingPlatform.TRADOVATE:
      return new TradovateAdapter();
    case TradingPlatform.NINJATRADER:
      throw new Error(
        "NinjaTrader integration is coming soon. This platform is not yet supported."
      );
    case TradingPlatform.RITHMIC:
      throw new Error(
        "Rithmic integration is coming soon. This platform is not yet supported."
      );
    default:
      throw new Error(`Unsupported trading platform: ${platform}`);
  }
}
