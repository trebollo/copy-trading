import { describe, it, expect } from "vitest";
import { createPlatformAdapter } from "@/lib/trading/adapter-factory";
import { TradingPlatform } from "@/lib/trading/types";
import { TradovateAdapter } from "@/lib/trading/tradovate";

describe("createPlatformAdapter", () => {
  it("returns TradovateAdapter for TRADOVATE platform", () => {
    const adapter = createPlatformAdapter(TradingPlatform.TRADOVATE);
    expect(adapter).toBeInstanceOf(TradovateAdapter);
  });

  it("throws error for NINJATRADER platform (not yet implemented)", () => {
    expect(() => createPlatformAdapter(TradingPlatform.NINJATRADER)).toThrow(
      "NinjaTrader integration is coming soon"
    );
  });

  it("throws error for RITHMIC platform (not yet implemented)", () => {
    expect(() => createPlatformAdapter(TradingPlatform.RITHMIC)).toThrow(
      "Rithmic integration is coming soon"
    );
  });

  it("throws error for unsupported platform", () => {
    expect(() =>
      createPlatformAdapter("UNKNOWN" as TradingPlatform)
    ).toThrow("Unsupported trading platform");
  });

  it("returns different instances on each call", () => {
    const adapter1 = createPlatformAdapter(TradingPlatform.TRADOVATE);
    const adapter2 = createPlatformAdapter(TradingPlatform.TRADOVATE);
    expect(adapter1).not.toBe(adapter2);
  });

  it("returned adapter has all required interface methods", () => {
    const adapter = createPlatformAdapter(TradingPlatform.TRADOVATE);
    expect(typeof adapter.connect).toBe("function");
    expect(typeof adapter.disconnect).toBe("function");
    expect(typeof adapter.getAccountInfo).toBe("function");
    expect(typeof adapter.getPositions).toBe("function");
    expect(typeof adapter.getOrders).toBe("function");
    expect(typeof adapter.placeTrade).toBe("function");
    expect(typeof adapter.cancelOrder).toBe("function");
    expect(typeof adapter.subscribeTrades).toBe("function");
  });
});
