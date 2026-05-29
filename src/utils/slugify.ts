/**
 * Converts heading text into a URL-safe slug (Polish diacritics included).
 */
export function slugify(text: string): string {
  return text
    .toLocaleLowerCase('pl-PL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
