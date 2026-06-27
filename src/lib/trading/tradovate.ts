import {
  type PlatformAdapter,
  type PlatformCredentials,
  type AccountInfo,
  type Position,
  type Order,
  type TradeSignal,
} from "./types";

const TRADOVATE_API_URL = "https://demo.tradovateapi.com/v1";
const TRADOVATE_LIVE_URL = "https://live.tradovateapi.com/v1";

interface TradovateToken {
  accessToken: string;
  expirationTime: string;
  userId: number;
}

export class TradovateAdapter implements PlatformAdapter {
  private token: TradovateToken | null = null;
  private credentials: PlatformCredentials | null = null;
  private baseUrl: string = TRADOVATE_API_URL;
  private subscribers: Set<(trade: TradeSignal) => void> = new Set();

  private getApiUrl(): string {
    if (this.credentials?.environment === "live") {
      return TRADOVATE_LIVE_URL;
    }
    return TRADOVATE_API_URL;
  }

  async connect(credentials: PlatformCredentials): Promise<void> {
    this.credentials = credentials;
    this.baseUrl = this.getApiUrl();
    await this.authenticate();
  }

  async disconnect(): Promise<void> {
    this.token = null;
    this.credentials = null;
    this.subscribers.clear();
  }

  async getAccountInfo(): Promise<AccountInfo> {
    this.ensureConnected();

    const response = await this.request(
      `/account/item?id=${this.credentials!.accountId}`
    );

    return {
      id: String(response.id),
      name: String(response.name || response.nickname || "Tradovate Account"),
      balance: Number(response.cashBalance ?? 0),
      currency: "USD",
      status: response.active ? "active" : "inactive",
      lastSync: new Date(),
    };
  }

  async getPositions(): Promise<Position[]> {
    this.ensureConnected();

    const response = await this.request("/position/list");

    if (!Array.isArray(response)) return [];

    return response.map((pos: Record<string, unknown>) => ({
      id: String(pos.id),
      symbol: String(pos.contractId || ""),
      side: (pos.netPos as number) > 0 ? ("long" as const) : ("short" as const),
      quantity: Math.abs(pos.netPos as number),
      entryPrice: (pos.avgPrice as number) ?? 0,
      currentPrice: (pos.currentPrice as number) ?? 0,
      unrealizedPnl: (pos.openPnl as number) ?? 0,
      openedAt: new Date(pos.timestamp as string),
    }));
  }

  async getOrders(): Promise<Order[]> {
    this.ensureConnected();

    const response = await this.request("/order/list");

    if (!Array.isArray(response)) return [];

    return response.map((order: Record<string, unknown>) => ({
      id: String(order.id),
      symbol: String(order.contractId || ""),
      side: order.action === "Buy" ? ("buy" as const) : ("sell" as const),
      type: this.mapOrderType(String(order.ordType || "Market")),
      quantity: (order.qty as number) ?? 0,
      price: order.price as number | undefined,
      stopPrice: order.stopPrice as number | undefined,
      status: this.mapOrderStatus(String(order.ordStatus || "")),
      filledAt: order.filledTime
        ? new Date(order.filledTime as string)
        : undefined,
      createdAt: new Date(order.timestamp as string),
    }));
  }

  async placeTrade(signal: TradeSignal): Promise<Order> {
    this.ensureConnected();

    const body = {
      accountSpec: this.credentials!.accountId,
      accountId: Number(this.credentials!.accountId),
      action: signal.side === "buy" ? "Buy" : "Sell",
      symbol: signal.symbol,
      orderQty: signal.quantity,
      orderType: this.mapSignalTypeToTradovate(signal.type),
      price: signal.price,
      stopPrice: signal.stopPrice,
      isAutomated: true,
    };

    const response = await this.request("/order/placeOrder", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return {
      id: String(response.orderId || response.id),
      symbol: signal.symbol,
      side: signal.side,
      type: signal.type,
      quantity: signal.quantity,
      price: signal.price,
      stopPrice: signal.stopPrice,
      status: "pending",
      createdAt: new Date(),
    };
  }

  async cancelOrder(orderId: string): Promise<void> {
    this.ensureConnected();

    await this.request("/order/cancelOrder", {
      method: "POST",
      body: JSON.stringify({ orderId: Number(orderId) }),
    });
  }

  subscribeTrades(callback: (trade: TradeSignal) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private async authenticate(): Promise<void> {
    if (!this.credentials) {
      throw new Error("No credentials provided");
    }

    const response = await fetch(`${this.baseUrl}/auth/accessTokenRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: this.credentials.apiKey,
        password: this.credentials.apiSecret,
        appId: "CopyTrader",
        appVersion: "1.0.0",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Tradovate authentication failed: ${response.statusText}`
      );
    }

    this.token = await response.json();
  }

  private async refreshToken(): Promise<void> {
    if (!this.token) {
      await this.authenticate();
      return;
    }

    const expirationTime = new Date(this.token.expirationTime).getTime();
    const now = Date.now();

    if (now >= expirationTime - 60000) {
      await this.authenticate();
    }
  }

  private async request(
    path: string,
    options: RequestInit = {}
  ): Promise<Record<string, unknown>> {
    await this.refreshToken();

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token!.accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Tradovate API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private ensureConnected(): void {
    if (!this.token || !this.credentials) {
      throw new Error("Adapter not connected. Call connect() first.");
    }
  }

  private mapOrderType(
    tradovateType: string
  ): "market" | "limit" | "stop" | "stop_limit" {
    switch (tradovateType) {
      case "Limit":
        return "limit";
      case "Stop":
        return "stop";
      case "StopLimit":
        return "stop_limit";
      default:
        return "market";
    }
  }

  private mapOrderStatus(
    tradovateStatus: string
  ): "pending" | "filled" | "cancelled" | "rejected" {
    switch (tradovateStatus) {
      case "Filled":
        return "filled";
      case "Cancelled":
        return "cancelled";
      case "Rejected":
        return "rejected";
      default:
        return "pending";
    }
  }

  private mapSignalTypeToTradovate(
    type: "market" | "limit" | "stop" | "stop_limit"
  ): string {
    switch (type) {
      case "limit":
        return "Limit";
      case "stop":
        return "Stop";
      case "stop_limit":
        return "StopLimit";
      default:
        return "Market";
    }
  }
}
