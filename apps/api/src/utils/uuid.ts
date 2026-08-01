/**
 * Validate that a string is a valid UUID (v4 format).
 * Accepts both hyphenated and non-hyphenated 36/32 char formats.
 */
export function isUUID(value: string): boolean {
  // Standard UUID v4: 8-4-4-4-12 with hyphens
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
