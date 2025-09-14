// src/app/api/report/route.ts
import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { analyzeTrades, computeHealth } from '../../lib/analysis';
import { getTasks, getTrades, initDB } from '../../lib/db';

export const runtime = 'nodejs'; // pdfkit requires node runtime

export async function GET() {
  try {
    await initDB();
    const trades = await getTrades();
    const tasks = await getTasks();
    const flags = analyzeTrades(trades);
    const health = computeHealth(trades, flags, tasks);

    const doc = new PDFDocument({ margin: 50 });

    // collect chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    // listen for finish/end
    const finished = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('finish', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));
    });

    // Build PDF content
    doc.fontSize(18).text('Transpera Compliance Report', { align: 'left' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Health Scores');
    doc.fontSize(12).list([
      `Overall: ${health.overall}`,
      `Compliance: ${health.complianceScore}`,
      `Surveillance: ${health.surveillanceScore}`,
      `Business: ${health.businessScore}`,
    ]);
    doc.moveDown();

    doc.fontSize(14).text('Open / Overdue Tasks');
    const openTasks = tasks.filter((t) => t.status !== 'COMPLETED');
    if (openTasks.length === 0) {
      doc.text('All tasks completed.');
    } else {
      openTasks.forEach((t) => {
        doc.fontSize(12).text(`- [${t.status}] ${t.title} (Due: ${new Date(t.due).toDateString()})`);
      });
    }
    doc.moveDown();

    doc.fontSize(14).text('Recent Flags');
    flags.slice(-10).forEach((f) => {
      doc.fontSize(12).text(`- [${f.severity}] ${f.type}: ${f.message}`);
    });

    // finalize the PDF (this triggers the stream 'end'/'finish' events)
    doc.end();

    // wait until all chunks are collected
    const pdfBuffer = await finished;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="transpera_compliance_report.pdf"',
      },
    });
  } catch (err) {
    // log the error to server console for debugging
    // Next.js dev terminal will show this
    // eslint-disable-next-line no-console
    console.error('Error generating PDF:', err);

    return NextResponse.json(
      { error: 'Failed to generate PDF', detail: String(err) },
      { status: 500 }
    );
  }
}
