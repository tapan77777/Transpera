// src/lib/db.ts
import type { ComplianceTask, Trade } from './types';

// in-memory fallback
let trades: Trade[] = [];
let tasks: ComplianceTask[] = [];

export async function initDB() {
  // no-op for in-memory
  return;
}

export async function getTrades() {
  return trades;
}

export async function saveTrades(all: Trade[]) {
  trades = all;
}

export async function getTasks() {
  return tasks;
}

export async function saveTasks(all: ComplianceTask[]) {
  tasks = all;
}
