/**
 * tRPC Transformers
 *
 * NOTE: tRPC v11 handles FormData, File, Blob, and ReadableStream natively.
 * When using `isNonJsonSerializable` with `splitLink`, the httpLink automatically
 * handles non-JSON content types without a custom transformer.
 *
 * The FormDataTransformer class was removed as it's no longer needed.
 * See: https://trpc.io/docs/server/non-json-content-types
 *
 * For FormData parsing on the server, use zod-form-data (zfd) or z.instanceof(FormData).
 */

export {};
