import { NextResponse } from 'next/server';
import { analyzeTrades, computeHealth } from '../../lib/analysis';
import { getTasks, getTrades, initDB } from '../../lib/db';

export async function GET() {
  await initDB();
  const trades = await getTrades();
  const tasks = await getTasks();
  const flags = analyzeTrades(trades);
  const health = computeHealth(trades, flags, tasks);
  return NextResponse.json({ health, flags });
}
