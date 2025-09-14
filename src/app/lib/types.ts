// src/lib/types.ts
export type Trade = {
  id: string;
  clientId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  ts: number; // epoch ms
};

export type Flag = {
  tradeId: string;
  type: 'HIGH_VOLUME' | 'PRICE_JUMP' | 'POTENTIAL_CIRCULARITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
};

export type ComplianceTask = {
  id: string;
  title: string;
  due: string; // ISO date
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  category: 'REGULATORY' | 'RISK' | 'REPORTING';
};

export type HealthScore = {
  complianceScore: number; // 0-100
  surveillanceScore: number; // 0-100
  businessScore: number; // 0-100
  overall: number; // weighted
  heatmap: number[]; // 14 values, 0-2 (low/med/high)
};
