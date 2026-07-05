import { NextRequest, NextResponse } from 'next/server';
import { intentRouter } from '@/lib/intent-router';
import { agentOrchestrator } from '@/lib/agent-orchestrator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, workspace, device, language } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid message' },
        { status: 400 }
      );
    }

    const extracted = intentRouter.route(message);

    const result = await agentOrchestrator.orchestrate(extracted, message);

    return NextResponse.json({
      intent: extracted.intent,
      confidence: extracted.confidence,
      actions: result.actions,
      message: result.message,
      data: result.data ?? null,
      success: result.success,
    });
  } catch (err: any) {
    console.error('[COPILOT_ROUTE_ERROR]', err);
    return NextResponse.json(
      { intent: 'unknown', actions: [], message: err.message, success: false },
      { status: 500 }
    );
  }
}
