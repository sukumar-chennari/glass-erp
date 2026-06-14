/**
 * Mock API utilities.
 *
 * Usage inside an RTK Query endpoint definition:
 *
 *   getVendors: builder.query<Vendor[], void>({
 *     ...mockableQuery({
 *       mockFn: () => MOCK_VENDORS,
 *       url: '/vendors',
 *     }),
 *     providesTags: ['Vendor'],
 *   }),
 *
 * When VITE_USE_MOCK_API=true  → queryFn runs, returns mock data.
 * When VITE_USE_MOCK_API=false → query runs, hits real endpoint.
 * Zero changes needed in the component or hook.
 */

export const USE_MOCK  = import.meta.env.VITE_USE_MOCK_API === 'true';
export const MOCK_DELAY = Number(import.meta.env.VITE_MOCK_DELAY_MS ?? 350);

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── Query (GET) ────────────────────────────────────────────────────

interface MockableQueryOptions<R, A> {
  mockFn: (arg: A) => R | Promise<R>;
  url:    string | ((arg: A) => string);
  params?: (arg: A) => Record<string, unknown>;
}

type MockableQueryResult<R, A> =
  | { queryFn: (arg: A) => Promise<{ data: R }> }
  | { query:   (arg: A) => { url: string; params?: Record<string, unknown> } };

export function mockableQuery<R, A = void>(
  options: MockableQueryOptions<R, A>,
): MockableQueryResult<R, A> {
  if (USE_MOCK) {
    return {
      queryFn: async (arg) => {
        await delay(MOCK_DELAY);
        const data = await options.mockFn(arg);
        return { data };
      },
    };
  }
  return {
    query: (arg) => ({
      url:    typeof options.url === 'function' ? options.url(arg) : options.url,
      params: options.params?.(arg),
    }),
  };
}

// ── Mutation (POST / PUT / PATCH / DELETE) ─────────────────────────

interface MockableMutationOptions<R, A> {
  mockFn:  (arg: A) => R | Promise<R>;
  url:     string | ((arg: A) => string);
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?:   (arg: A) => unknown;
}

type MockableMutationResult<R, A> =
  | { queryFn: (arg: A) => Promise<{ data: R }> }
  | { query:   (arg: A) => { url: string; method: string; body?: unknown } };

export function mockableMutation<R, A = void>(
  options: MockableMutationOptions<R, A>,
): MockableMutationResult<R, A> {
  if (USE_MOCK) {
    return {
      queryFn: async (arg) => {
        await delay(MOCK_DELAY);
        const data = await options.mockFn(arg);
        return { data };
      },
    };
  }
  return {
    query: (arg) => ({
      url:    typeof options.url === 'function' ? options.url(arg) : options.url,
      method: options.method ?? 'POST',
      body:   options.body ? options.body(arg) : arg,
    }),
  };
}

// ── Helpers ────────────────────────────────────────────────────────

/** Generate a predictable-looking fake ID for mock creates. */
export function mockId(prefix = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Format Indian currency. */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
