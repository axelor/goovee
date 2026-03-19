export const dynamic = 'force-dynamic';

import {NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {PAYMENT_SOURCE, PaymentSource} from '@/lib/core/payment/common/type';
import {subscribe, unsubscribe} from '@/lib/core/payment/sse';

const VALID_SOURCES = Object.values(PAYMENT_SOURCE) as string[];
const KEEP_ALIVE_INTERVAL_MS = 30_000;

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const source = searchParams.get('source');
  const entityId = searchParams.get('entityId');
  const contextId = searchParams.get('contextId');

  if (!source || !VALID_SOURCES.includes(source) || !entityId || !contextId) {
    return new NextResponse('Bad Request', {status: 400});
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      try {
        subscribe(source as PaymentSource, entityId, contextId, controller);
      } catch (err) {
        controller.error(err);
        return;
      }

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(':\n\n'));
        } catch {
          clearInterval(keepAlive);
        }
      }, KEEP_ALIVE_INTERVAL_MS);

      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);

        try {
          unsubscribe(source as PaymentSource, entityId, contextId, controller);
        } catch {
          // ignore unsubscribe errors on disconnect
        }

        try {
          controller.close();
        } catch {
          // stream already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
