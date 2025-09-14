import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getTasks, initDB, saveTasks } from '../../lib/db';
import type { ComplianceTask } from '../../lib/types';

export async function GET() {
  await initDB();
  const tasks = await getTasks();
  return NextResponse.json(tasks);
}

export async function PATCH(req: NextRequest) {
  await initDB();
  const body = await req.json();
  const { id, status } = body as { id: string; status: ComplianceTask['status'] };
  const tasks = await getTasks();
  const t = tasks.find(x => x.id === id);
  if (t) t.status = status;
  await saveTasks(tasks);
  return NextResponse.json({ ok: true });
}
