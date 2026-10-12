import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand colors
        'navy-blue': {
          DEFAULT: '#1e3a5f',
          dark: '#152d47',
          light: '#2d4a6f',
        },
        'brand-orange': {
          DEFAULT: '#f97316',
          hover: '#ea580c',
          light: '#fb923c',
        },
        'brand-blue': {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
        // Notification colors
        'notification-red': {
          bg: '#fee2e2',
          border: '#fca5a5',
          text: '#991b1b',
        },
        'notification-amber': {
          bg: '#fef3c7',
          border: '#fcd34d',
          text: '#92400e',
        },
      },
      // Typography for markdown
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#111827',
            p: {
              marginTop: '0.75rem',
              marginBottom: '0.75rem',
            },
            strong: {
              color: '#111827',
              fontWeight: '600',
            },
            ul: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            li: {
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
