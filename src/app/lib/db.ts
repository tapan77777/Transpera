import { MongoClient } from 'mongodb';
import type { ComplianceTask, Trade } from './types';


let client: MongoClient | null = null;
let useMongo = false;


// In-memory fallback
let MEM = {
trades: [] as Trade[],
tasks: [] as ComplianceTask[],
};


export async function initDB() {
const uri = process.env.MONGODB_URI;
if (!uri) return;
if (client) return;
client = new MongoClient(uri);
await client.connect();
useMongo = true;
}


function col(name: 'trades' | 'tasks') {
if (!client) throw new Error('Mongo not initialized');
return client.db('transpera').collection(name);
}


export async function getTrades(): Promise<Trade[]> {
if (useMongo) return (await col('trades').find().sort({ ts: 1 }).toArray()) as any;
return MEM.trades.sort((a, b) => a.ts - b.ts);
}


export async function saveTrades(trades: Trade[]) {
if (useMongo) {
await col('trades').deleteMany({});
if (trades.length) await col('trades').insertMany(trades as any);
} else {
MEM.trades = trades;
}
}


export async function getTasks(): Promise<ComplianceTask[]> {
if (useMongo) return (await col('tasks').find().toArray()) as any;
return MEM.tasks;
}


export async function saveTasks(tasks: ComplianceTask[]) {
if (useMongo) {
await col('tasks').deleteMany({});
if (tasks.length) await col('tasks').insertMany(tasks as any);
} else {
MEM.tasks = tasks;
}
}