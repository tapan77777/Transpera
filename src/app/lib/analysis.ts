import dayjs from 'dayjs';
if (within5m && oppositeSide && sameClient && t.qty === prev.qty) {
flags.push({
tradeId: t.id,
type: 'POTENTIAL_CIRCULARITY',
severity: 'MEDIUM',
message: `${symbol}: Rapid opposite trades by ${t.clientId}`,
});
}
}


// update MA window (last 10 trades)
window.push(t.qty); if (window.length > 10) window.shift();
prevPrice = t.price;
}
}


return flags;
}


export function computeHealth(trades: Trade[], flags: Flag[], tasks: ComplianceTask[]): HealthScore {
// Compliance score: based on tasks
const total = tasks.length || 1;
const completed = tasks.filter(t=>t.status==='COMPLETED').length;
const overdue = tasks.filter(t=>t.status==='OVERDUE').length;
const complianceScore = Math.max(0, Math.min(100, Math.round((completed/total)*100 - overdue*5)));


// Surveillance score: fewer + lower severity flags = better
const penalty = flags.reduce((acc,f)=> acc + (f.severity==='HIGH'?8:f.severity==='MEDIUM'?4:2), 0);
const base = 100; // start perfect
const surveillanceScore = Math.max(0, base - penalty);


// Business score: simple proxy = daily activity recency + trade count
const now = Date.now();
const recent = trades.filter(t=> now - t.ts < 7*24*60*60*1000).length;
const businessScore = Math.max(10, Math.min(100, 30 + Math.round(Math.log2(1+recent)*15)));


// Overall weighted
const overall = Math.round(0.45*complianceScore + 0.35*surveillanceScore + 0.2*businessScore);


// Heatmap sample (14 cells = last 14 days risk: 0 low, 1 med, 2 high)
const buckets: Record<string, number> = {};
trades.forEach(t=>{
const d = dayjs(t.ts).format('YYYY-MM-DD');
buckets[d] = (buckets[d]||0) + 1;
});
const heatmap: number[] = [];
for (let i=13;i>=0;i--) {
const d = dayjs().subtract(i,'day').format('YYYY-MM-DD');
const n = buckets[d]||0;
heatmap.push(n>15?2:n>5?1:0);
}


return { complianceScore, surveillanceScore, businessScore, overall, heatmap };
}