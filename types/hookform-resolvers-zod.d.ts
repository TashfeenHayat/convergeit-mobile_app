/**
 * Ambient typing for `@hookform/resolvers/zod` (parity with web
 * `converge_saas_frontend/types/hookform-resolvers-zod.d.ts`).
 * Install `react-hook-form`, `zod`, and `@hookform/resolvers` when forms need it.
 */
declare module '@hookform/resolvers/zod' {
  // Loose signature — avoids requiring `react-hook-form` types until that dep lands.
  export function zodResolver(
    schema: unknown,
    schemaOptions?: unknown,
    resolverOptions?: unknown,
  ): // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any;
}
