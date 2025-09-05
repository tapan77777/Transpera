import { NextResponse } from 'next/server';
import { getTrades, initDB, saveTrades } from '../../lib/db';
import type { Trade } from '../../lib/types';


export async function GET(){
await initDB();
const trades = await getTrades();
return NextResponse.json(trades);
}


export async function POST(req: Request){
await initDB();
const body = (await req.json()) as Trade;
const trades = await getTrades();
trades.push(body);
await saveTrades(trades);
return NextResponse.json({ ok:true });
}