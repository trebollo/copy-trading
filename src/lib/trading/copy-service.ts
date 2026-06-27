import type { PlatformAdapter, TradeSignal, PlatformCredentials } from "./types";
import { TradingPlatform } from "./types";
import { createPlatformAdapter } from "./adapter-factory";
import { copyEngine, type CopyGroupConfig } from "./copy-engine";

/**
 * Subscribes to trade signals from a master account's platform adapter
 * and automatically copies them to all follower accounts in the group
 * via the CopyEngine.
 *
 * Returns an unsubscribe function to stop the subscription.
 */
export function subscribeMasterAccount(
  group: CopyGroupConfig,
  masterPlatform: TradingPlatform,
  masterCredentials: PlatformCredentials,
  getFollowerAdapter: (accountId: string) => PlatformAdapter
): { unsubscribe: () => void; adapter: PlatformAdapter } {
  const masterAdapter = createPlatformAdapter(masterPlatform);

  // Connect the master adapter (fire and forget for subscription setup)
  masterAdapter.connect(masterCredentials).catch((err) => {
    console.error(
      `[CopyService] Failed to connect master adapter for group ${group.id}:`,
      err
    );
  });

  // Subscribe to trade signals from the master account
  const unsubscribe = masterAdapter.subscribeTrades(
    (signal: TradeSignal) => {
      // Process each incoming signal through the copy engine
      copyEngine
        .processTradeSignal(group, signal, getFollowerAdapter)
        .then((result) => {
          const successful = result.results.filter((r) => r.success).length;
          const failed = result.results.filter((r) => !r.success).length;
          console.log(
            `[CopyService] Group "${group.name}": processed signal ${signal.symbol} ${signal.side} x${signal.quantity} -> ${successful} success, ${failed} failed`
          );
        })
        .catch((err) => {
          console.error(
            `[CopyService] Error processing signal for group ${group.id}:`,
            err
          );
        });
    }
  );

  return { unsubscribe, adapter: masterAdapter };
}

/**
 * Creates a follower adapter getter function for a set of member accounts.
 * Each adapter is pre-created (but not connected -- connection happens on first trade).
 */
export function createFollowerAdapterGetter(
  members: Array<{
    accountId: string;
    platform: TradingPlatform;
    credentials: PlatformCredentials;
  }>
): (accountId: string) => PlatformAdapter {
  const adapterMap = new Map<string, PlatformAdapter>();

  for (const member of members) {
    try {
      const adapter = createPlatformAdapter(member.platform);
      // Pre-connect each follower adapter
      adapter.connect(member.credentials).catch((err) => {
        console.error(
          `[CopyService] Failed to connect follower adapter for account ${member.accountId}:`,
          err
        );
      });
      adapterMap.set(member.accountId, adapter);
    } catch (err) {
      console.error(
        `[CopyService] Failed to create adapter for account ${member.accountId}:`,
        err
      );
    }
  }

  return (accountId: string): PlatformAdapter => {
    const adapter = adapterMap.get(accountId);
    if (!adapter) {
      throw new Error(
        `No adapter available for account ${accountId}. Platform may not be supported.`
      );
    }
    return adapter;
  };
}
