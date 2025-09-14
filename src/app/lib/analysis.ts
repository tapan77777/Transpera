// src/lib/analysis.ts
import dayjs from 'dayjs';
import type { ComplianceTask, Flag, HealthScore, Trade } from './types';

/**
 * Analyze trades and produce flags for suspicious behaviour.
 */
export function analyzeTrades(trades: Trade[]): Flag[] {
  const flags: Flag[] = [];
  const bySymbol: Record<string, Trade[]> = {};

  trades.forEach((t) => {
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = [];
    bySymbol[t.symbol].push(t);
  });

  // Sort trades by time per symbol
  Object.values(bySymbol).forEach((arr) => arr.sort((a, b) => a.ts - b.ts));

  for (const [symbol, arr] of Object.entries(bySymbol)) {
    // simple rolling window for average qty
    const window: number[] = [];
    let prevPrice: number | null = null;

    for (let i = 0; i < arr.length; i++) {
      const t = arr[i];
      const avgQty = window.length ? window.reduce((a, b) => a + b, 0) / window.length : 0;

      // High volume flag (> 4x rolling avg OR qty > 50)
      if ((avgQty > 0 && t.qty > 4 * avgQty) || t.qty > 50) {
        flags.push({
          tradeId: t.id,
          type: 'HIGH_VOLUME',
          severity: t.qty > 100 ? 'HIGH' : 'MEDIUM',
          message: `${symbol}: Unusual quantity ${t.qty} vs avg ${avgQty.toFixed(1)}`,
        });
      }

      // Price jump > 10% vs previous
      if (prevPrice !== null) {
        const chg = (t.price - prevPrice) / prevPrice;
        if (Math.abs(chg) >= 0.1) {
          flags.push({
            tradeId: t.id,
            type: 'PRICE_JUMP',
            severity: Math.abs(chg) > 0.2 ? 'HIGH' : 'MEDIUM',
            message: `${symbol}: Price changed ${(chg * 100).toFixed(1)}%`,
          });
        }
      }

      // Potential circularity: quick opposite trades by the same client & symbol within 5 minutes
      if (i > 0) {
        const prev = arr[i - 1];
        const within5m = Math.abs(t.ts - prev.ts) <= 5 * 60 * 1000;
        const oppositeSide = prev.side !== t.side;
        const sameClient = prev.clientId === t.clientId;
        if (within5m && oppositeSide && sameClient && t.qty === prev.qty) {
          flags.push({
            tradeId: t.id,
            type: 'POTENTIAL_CIRCULARITY',
            severity: 'MEDIUM',
            message: `${symbol}: Rapid opposite trades by ${t.clientId}`,
          });
        }
      }

      // update moving average window (last 10 trades)
      window.push(t.qty);
      if (window.length > 10) window.shift();
      prevPrice = t.price;
    }
  }

  return flags;
}

/**
 * Compute an overall health score for the broker given trades, flags and compliance tasks.
 */
export function computeHealth(trades: Trade[], flags: Flag[], tasks: ComplianceTask[]): HealthScore {
  // Compliance score: based on tasks
  const total = tasks.length || 1;
  const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdue = tasks.filter((t) => t.status === 'OVERDUE').length;
  const complianceScore = Math.max(0, Math.min(100, Math.round((completed / total) * 100 - overdue * 5)));

  // Surveillance score: fewer + lower severity flags = better
  const penalty = flags.reduce((acc, f) => acc + (f.severity === 'HIGH' ? 8 : f.severity === 'MEDIUM' ? 4 : 2), 0);
  const base = 100; // start perfect
  const surveillanceScore = Math.max(0, base - penalty);

  // Business score: simple proxy = weekly activity recency + trade count
  const now = Date.now();
  const recent = trades.filter((t) => now - t.ts < 7 * 24 * 60 * 60 * 1000).length;
  const businessScore = Math.max(10, Math.min(100, 30 + Math.round(Math.log2(1 + recent) * 15)));

  // Overall weighted score
  const overall = Math.round(0.45 * complianceScore + 0.35 * surveillanceScore + 0.2 * businessScore);

  // Heatmap sample (14 cells = last 14 days risk: 0 low, 1 med, 2 high)
  const buckets: Record<string, number> = {};
  trades.forEach((t) => {
    const d = dayjs(t.ts).format('YYYY-MM-DD');
    buckets[d] = (buckets[d] || 0) + 1;
  });

  const heatmap: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const n = buckets[d] || 0;
    heatmap.push(n > 15 ? 2 : n > 5 ? 1 : 0);
  }

  return { complianceScore, surveillanceScore, businessScore, overall, heatmap };
}
