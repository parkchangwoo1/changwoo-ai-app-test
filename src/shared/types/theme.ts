export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  surfacePrimary: string;
  surfaceSecondary: string;
  surfaceHover: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accentPrimary: string;
  accentSecondary: string;
  borderPrimary: string;
  borderSecondary: string;
  error: string;
  errorBg: string;
  success: string;
  warning: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
}

export interface Theme {
  colors: ThemeColors;
}
