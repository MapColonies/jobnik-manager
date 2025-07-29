import { Tracing } from '@map-colonies/telemetry';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { context, propagation } from '@opentelemetry/api';
import { IGNORED_INCOMING_TRACE_ROUTES, IGNORED_OUTGOING_TRACE_ROUTES } from './constants';

let tracing: Tracing | undefined;

export function tracingFactory(options: ConstructorParameters<typeof Tracing>[0]): Tracing {
  tracing = new Tracing({
    ...options,
    instrumentations: [new PrismaInstrumentation()],
    autoInstrumentationsConfigMap: {
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (request): boolean =>
          IGNORED_INCOMING_TRACE_ROUTES.some((route) => request.url !== undefined && route.test(request.url)),
        ignoreOutgoingRequestHook: (request): boolean =>
          IGNORED_OUTGOING_TRACE_ROUTES.some((route) => typeof request.path === 'string' && route.test(request.path)),
      },
      '@opentelemetry/instrumentation-fs': {
        requireParentSpan: true,
      },
    },
  });

  return tracing;
}

export function getTracing(): Tracing {
  if (!tracing) {
    throw new Error('tracing not initialized');
  }
  return tracing;
}

export interface Carrier {
  traceparent?: string;
  tracestate?: string;
}

/**
 * Type that ensures traceparent is required and tracestate is nullable
 */
export interface ResolvedTraceContext {
  readonly traceparent: string;
  readonly tracestate: string | null;
}

/**
 * Type that represents a payload with optional trace context fields
 */
export interface OptionalTraceContext {
  readonly traceparent?: string;
  readonly tracestate?: string | null;
}

/**
 * Resolves trace context values for database operations.
 * Uses provided trace context from request if available, otherwise injects from active OpenTelemetry context.
 *
 * @param payload - Payload that may contain optional traceparent and tracestate
 * @returns Object with required traceparent string and nullable tracestate
 */
export function resolveTraceContext(payload: OptionalTraceContext): ResolvedTraceContext {
  // If user provided traceparent, use user's trace context
  if (payload.traceparent !== undefined) {
    return {
      traceparent: payload.traceparent,
      tracestate: payload.tracestate ?? null,
    };
  }

  // If user didn't provide traceparent, inject from active OpenTelemetry context
  const traceContext: Carrier = {};
  propagation.inject(context.active(), traceContext);

  return {
    traceparent: traceContext.traceparent ?? '',
    tracestate: traceContext.tracestate ?? null,
  };
}

/**
 * Type helper that transforms a payload with optional trace context into one with required trace context.
 * This ensures type safety when passing data to Prisma which requires these fields.
 */
export type WithRequiredTraceContext<T extends OptionalTraceContext> = Omit<T, 'traceparent' | 'tracestate'> & ResolvedTraceContext;
