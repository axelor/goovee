export const dynamic = 'force-dynamic';

import {NextResponse} from 'next/server';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {subscribe, unsubscribe} from '@/lib/core/payment/sse';
import {PaymentSourceSchema} from '@/lib/core/payment/common/validators';
import {IdSchema} from '@/utils/validators';
import {manager} from '@/tenant';

const KEEP_ALIVE_INTERVAL_MS = 30_000;

const SSEQuerySchema = z.object({
  source: PaymentSourceSchema,
  entityId: IdSchema,
  contextId: IdSchema,
});

type SSEQuery = z.infer<typeof SSEQuerySchema>;

function parseQuery(searchParams: URLSearchParams): {
  data?: SSEQuery;
  error?: string;
} {
  const source = searchParams.get('source');
  const entityId = searchParams.get('entityId');
  const contextId = searchParams.get('contextId');

  const result = SSEQuerySchema.safeParse({source, entityId, contextId});

  if (!result.success) {
    return {error: z.prettifyError(result.error)};
  }

  return {data: result.data};
}

export async function GET(
  request: Request,
  props: {params: Promise<{tenant: string}>},
) {
  const {tenant: tenantId} = await props.params;

  /* The stream is in-memory pub/sub keyed by tenant, so no tenant client is
   * needed here — just reject subscriptions for an unknown tenant path. */
  const tenantIds = await manager.listTenantIds();
  if (!tenantIds.includes(tenantId)) {
    return new NextResponse('Bad Request', {status: 400});
  }

  const {searchParams} = new URL(request.url);
  const {data, error} = parseQuery(searchParams);

  if (error) {
    return new NextResponse(error, {status: 400});
  }

  const {source, entityId, contextId} = data!;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      try {
        subscribe(tenantId, source, entityId, contextId, controller);
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
          unsubscribe(tenantId, source, entityId, contextId, controller);
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
