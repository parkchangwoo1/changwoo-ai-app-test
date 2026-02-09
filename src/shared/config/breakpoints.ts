export const BREAKPOINTS = {
  mobile: 768,
} as const;

export const MEDIA = {
  mobile: `@media (max-width: ${BREAKPOINTS.mobile}px)`,
} as const;
