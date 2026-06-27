import { TradingPlatform, type PlatformAdapter } from "./types";
import { TradovateAdapter } from "./tradovate";

export function createPlatformAdapter(platform: TradingPlatform): PlatformAdapter {
  switch (platform) {
    case TradingPlatform.TRADOVATE:
      return new TradovateAdapter();
    case TradingPlatform.NINJATRADER:
      throw new Error(
        "NinjaTrader adapter is not yet implemented. Coming soon."
      );
    case TradingPlatform.RITHMIC:
      throw new Error("Rithmic adapter is not yet implemented. Coming soon.");
    default:
      throw new Error(`Unsupported trading platform: ${platform}`);
  }
}
