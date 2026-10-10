/**
 * RFC 7807 Problem Details representation.
 * Standardizes machine-readable error responses across serverless endpoints.
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Creates an RFC 7807 complaint error structure.
 */
export function createProblemDetails(
  status: number,
  title: string,
  detail: string,
  typeCode: string,
  instance: string = '/api/webhook',
  extras?: Record<string, unknown>
): ProblemDetails {
  return {
    type: `https://api.graphflow.dev/errors/${typeCode}`,
    title,
    status,
    detail,
    instance,
    timestamp: new Date().toISOString(),
    ...extras,
  };
}
