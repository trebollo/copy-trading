import type { TradeSignal, PlatformAdapter } from "./types";
import type { MemberRiskSettings } from "@/lib/validations/copy-group";

export interface CopyGroupConfig {
  id: string;
  name: string;
  isActive: boolean;
  masterAccountId: string;
  members: CopyGroupMember[];
}

export interface CopyGroupMember {
  accountId: string;
  riskMultiplier: number;
  maxLots: number;
  maxDailyLoss: number;
  isActive: boolean;
  dailyLossUsed: number;
}

export interface CopyTradeResult {
  accountId: string;
  success: boolean;
  originalQuantity: number;
  adjustedQuantity: number;
  reason?: string;
  orderId?: string;
}

export interface ProcessSignalResult {
  groupId: string;
  masterSignal: TradeSignal;
  results: CopyTradeResult[];
  timestamp: Date;
}

export class CopyEngine {
  /**
   * Process a trade signal from a master account and copy it to all active followers
   * in the group. Returns results for each member attempt.
   */
  async processTradeSignal(
    group: CopyGroupConfig,
    signal: TradeSignal,
    getAdapter: (accountId: string) => PlatformAdapter
  ): Promise<ProcessSignalResult> {
    const results: CopyTradeResult[] = [];

    if (!group.isActive) {
      return {
        groupId: group.id,
        masterSignal: signal,
        results: [],
        timestamp: new Date(),
      };
    }

    for (const member of group.members) {
      if (!member.isActive) {
        results.push({
          accountId: member.accountId,
          success: false,
          originalQuantity: signal.quantity,
          adjustedQuantity: 0,
          reason: "Member is inactive",
        });
        continue;
      }

      const riskCheck = this.checkRiskLimits(member, signal);
      if (!riskCheck.allowed) {
        results.push({
          accountId: member.accountId,
          success: false,
          originalQuantity: signal.quantity,
          adjustedQuantity: 0,
          reason: riskCheck.reason,
        });
        continue;
      }

      const adjustedQuantity = this.calculateAdjustedQuantity(
        signal.quantity,
        member
      );

      if (adjustedQuantity <= 0) {
        results.push({
          accountId: member.accountId,
          success: false,
          originalQuantity: signal.quantity,
          adjustedQuantity: 0,
          reason: "Adjusted quantity is zero after applying risk settings",
        });
        continue;
      }

      const result = await this.executeCopyTrade(
        member,
        { ...signal, quantity: adjustedQuantity },
        getAdapter
      );

      results.push({
        ...result,
        originalQuantity: signal.quantity,
      });
    }

    return {
      groupId: group.id,
      masterSignal: signal,
      results,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate the adjusted quantity for a follower based on their risk settings.
   * Applies riskMultiplier then caps at maxLots.
   */
  calculateAdjustedQuantity(
    originalQuantity: number,
    member: Pick<MemberRiskSettings, "riskMultiplier" | "maxLots">
  ): number {
    const multiplied = originalQuantity * member.riskMultiplier;
    const floored = Math.floor(multiplied);
    return Math.min(floored, member.maxLots);
  }

  /**
   * Check if a member's risk limits allow the trade to proceed.
   * Verifies maxDailyLoss has not been exceeded.
   */
  checkRiskLimits(
    member: CopyGroupMember,
    signal: TradeSignal
  ): { allowed: boolean; reason?: string } {
    if (member.dailyLossUsed >= member.maxDailyLoss) {
      return {
        allowed: false,
        reason: `Daily loss limit reached (${member.dailyLossUsed}/${member.maxDailyLoss})`,
      };
    }

    const remainingBudget = member.maxDailyLoss - member.dailyLossUsed;
    if (remainingBudget <= 0) {
      return {
        allowed: false,
        reason: "No remaining daily loss budget",
      };
    }

    const adjustedQty = this.calculateAdjustedQuantity(signal.quantity, member);
    if (adjustedQty <= 0) {
      return {
        allowed: false,
        reason: "Adjusted quantity would be zero",
      };
    }

    return { allowed: true };
  }

  /**
   * Execute the copy trade on the follower's platform adapter.
   */
  private async executeCopyTrade(
    member: CopyGroupMember,
    signal: TradeSignal,
    getAdapter: (accountId: string) => PlatformAdapter
  ): Promise<CopyTradeResult> {
    try {
      const adapter = getAdapter(member.accountId);
      const order = await adapter.placeTrade(signal);

      return {
        accountId: member.accountId,
        success: true,
        originalQuantity: signal.quantity,
        adjustedQuantity: signal.quantity,
        orderId: order.id,
      };
    } catch (error) {
      return {
        accountId: member.accountId,
        success: false,
        originalQuantity: signal.quantity,
        adjustedQuantity: signal.quantity,
        reason:
          error instanceof Error
            ? error.message
            : "Unknown error placing trade",
      };
    }
  }
}

// Singleton instance
export const copyEngine = new CopyEngine();
