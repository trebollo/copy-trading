export enum TradingPlatform {
  TRADOVATE = "TRADOVATE",
  NINJATRADER = "NINJATRADER",
  RITHMIC = "RITHMIC",
}

export interface AccountInfo {
  id: string;
  name: string;
  balance: number;
  currency: string;
  status: "active" | "inactive" | "error";
  lastSync?: Date;
}

export interface Position {
  id: string;
  symbol: string;
  side: "long" | "short";
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  openedAt: Date;
}

export interface Order {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop" | "stop_limit";
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: "pending" | "filled" | "cancelled" | "rejected";
  filledAt?: Date;
  createdAt: Date;
}

export interface TradeSignal {
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop" | "stop_limit";
  quantity: number;
  price?: number;
  stopPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
}

export interface PlatformAdapter {
  connect(credentials: PlatformCredentials): Promise<void>;
  disconnect(): Promise<void>;
  getAccountInfo(): Promise<AccountInfo>;
  getPositions(): Promise<Position[]>;
  getOrders(): Promise<Order[]>;
  placeTrade(signal: TradeSignal): Promise<Order>;
  cancelOrder(orderId: string): Promise<void>;
  subscribeTrades(callback: (trade: TradeSignal) => void): () => void;
}

export interface PlatformCredentials {
  apiKey?: string;
  apiSecret?: string;
  accountId: string;
  environment?: "live" | "demo";
}
