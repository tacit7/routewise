/**
 * Sanitizes a string to be safe for use as a filename
 * @param input The string to sanitize
 * @param maxLength Maximum length of the sanitized string (default: 20)
 * @returns A sanitized string safe for filenames
 */
export function sanitizeForFilename(input: string, maxLength: number = 20): string {
  return input
    .substring(0, maxLength)
    .replace(/[^a-zA-Z0-9]/g, "_");
}

/**
 * Creates a safe filename with prefix and extension
 * @param prefix The filename prefix
 * @param identifier The identifier to sanitize
 * @param extension The file extension (default: 'mock.json')
 * @param maxIdentifierLength Maximum length for the identifier part (default: 20)
 * @returns A complete safe filename
 */
export function createSafeFilename(
  prefix: string, 
  identifier: string, 
  extension: string = 'mock.json',
  maxIdentifierLength: number = 20
): string {
  const sanitizedId = sanitizeForFilename(identifier, maxIdentifierLength);
  return `${prefix}-${sanitizedId}.${extension}`;
}
