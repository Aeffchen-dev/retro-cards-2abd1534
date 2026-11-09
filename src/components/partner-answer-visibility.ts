export function revealSelection(own: unknown, partner: string | undefined): string | undefined {
  return own !== undefined && own !== null && own !== '' ? partner : undefined;
}