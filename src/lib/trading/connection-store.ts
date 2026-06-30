export interface TradovateConnection {
  id: string;
  label: string;
  username: string;
  environment: "demo" | "live";
  status: "connected" | "disconnected" | "error";
  lastSync: string | null;
  accounts: { id: string; name: string }[];
  debug?: string[];
}

const STORAGE_KEY = "tradovate-connections";

export function getConnections(): TradovateConnection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TradovateConnection[];
  } catch {
    return [];
  }
}

export function saveConnections(connections: TradovateConnection[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
}

export function addConnection(
  conn: Omit<TradovateConnection, "id">
): TradovateConnection {
  const connections = getConnections();
  const newConn: TradovateConnection = {
    ...conn,
    id: crypto.randomUUID(),
  };
  connections.push(newConn);
  saveConnections(connections);
  return newConn;
}

export function updateConnection(
  id: string,
  partial: Partial<Omit<TradovateConnection, "id">>
): TradovateConnection | null {
  const connections = getConnections();
  const index = connections.findIndex((c) => c.id === id);
  if (index === -1) return null;
  connections[index] = { ...connections[index], ...partial };
  saveConnections(connections);
  return connections[index];
}

export function removeConnection(id: string): boolean {
  const connections = getConnections();
  const filtered = connections.filter((c) => c.id !== id);
  if (filtered.length === connections.length) return false;
  saveConnections(filtered);
  return true;
}
