import { NextResponse } from 'next/server';
import { initDB, saveTasks, saveTrades } from '../../lib/db';
import type { ComplianceTask, Trade } from '../../lib/types';


function rnd(min:number,max:number){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick<T>(arr:T[]) { return arr[Math.floor(Math.random()*arr.length)]; }


export async function POST() {
await initDB();
const symbols = ['RELIANCE','TCS','HDFCBANK','INFY','ITC'];
const clients = ['C001','C002','C003','C004'];
const now = Date.now();


const trades: Trade[] = [];
let ts = now - 5*24*60*60*1000; // last 5 days
for (let i=0;i<120;i++){
ts += rnd(5,90)*60*1000; // 5-90 minutes gaps
const sym = pick(symbols);
const qty = rnd(1,120);
const price = rnd(80,120) + (sym==='RELIANCE'?900:0);
trades.push({ id: `T${i}`, clientId: pick(clients), symbol: sym, side: Math.random()>0.5?'BUY':'SELL', qty, price, ts });
}


const tasks: ComplianceTask[] = [
{ id:'KRA-2025-09', title:'KRA/KYC Periodic Review', due:new Date(now+2*24*3600*1000).toISOString(), status:'PENDING', category:'REGULATORY' },
{ id:'AML-STR', title:'Monthly STR Submission', due:new Date(now-1*24*3600*1000).toISOString(), status:'OVERDUE', category:'REPORTING' },
{ id:'RMS-TEST', title:'Quarterly RMS Backtesting', due:new Date(now+10*24*3600*1000).toISOString(), status:'PENDING', category:'RISK' },
{ id:'UCC-HEALTH', title:'UCC Master Reconciliation', due:new Date(now-10*24*3600*1000).toISOString(), status:'COMPLETED', category:'REGULATORY' },
];


await saveTrades(trades);
await saveTasks(tasks);


return NextResponse.json({ ok:true, trades: trades.length, tasks: tasks.length });
}