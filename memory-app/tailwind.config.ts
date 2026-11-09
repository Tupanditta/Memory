import type { Config } from "tailwindcss";

// Tokens del prototipo: bloque `tailwind.config` de Software/prototipo/*/code.html,
// copiado sin cambios (ver design.md, "Tokens"). Las sombras con nombre se añaden en el Sprint 9.
const prototipo: NonNullable<Config["theme"]>["extend"] = {
  "colors": {
    "on-error": "#ffffff",
    "on-primary-fixed-variant": "#0f3bad",
    "on-tertiary-container": "#003126",
    "on-secondary-fixed": "#1e0060",
    "surface-variant": "#dbe1ff",
    "surface-container-high": "#e3e7ff",
    "inverse-surface": "#272f4a",
    "surface-container-highest": "#dbe1ff",
    "on-tertiary": "#ffffff",
    "surface-container-lowest": "#ffffff",
    "secondary-fixed-dim": "#ccbeff",
    "surface-dim": "#d1d9fb",
    "secondary-container": "#ac97ff",
    "on-error-container": "#93000a",
    "tertiary-fixed": "#a6f2d7",
    "surface-container-low": "#f2f3ff",
    "on-tertiary-fixed": "#002118",
    "tertiary-container": "#569f88",
    "outline-variant": "#c4c5d5",
    "on-tertiary-fixed-variant": "#00513f",
    "on-secondary-container": "#3f288b",
    "inverse-on-surface": "#eff0ff",
    "primary": "#3355c6",
    "on-primary-container": "#002173",
    "on-background": "#121a34",
    "tertiary-fixed-dim": "#8bd5bc",
    "surface-container": "#ebedff",
    "secondary-fixed": "#e7deff",
    "primary-fixed-dim": "#b7c4ff",
    "on-surface-variant": "#444653",
    "inverse-primary": "#b7c4ff",
    "background": "#faf8ff",
    "on-secondary-fixed-variant": "#4b3597",
    "on-primary": "#ffffff",
    "secondary": "#634eb1",
    "tertiary": "#1b6a56",
    "surface": "#faf8ff",
    "on-secondary": "#ffffff",
    "surface-tint": "#3355c6",
    "primary-fixed": "#dce1ff",
    "on-primary-fixed": "#001551",
    "outline": "#747685",
    "primary-container": "#6b8afd",
    "surface-bright": "#faf8ff",
    "on-surface": "#121a34",
    "error-container": "#ffdad6",
    "error": "#ba1a1a"
  },
  "borderRadius": {
    "DEFAULT": "1rem",
    "lg": "2rem",
    "xl": "3rem",
    "full": "9999px"
  },
  "spacing": {
    "space-xs": "0.25rem",
    "space-lg": "1.5rem",
    "space-md": "1rem",
    "gutter": "1rem",
    "space-sm": "0.5rem",
    "margin": "1.25rem",
    "space-xl": "2rem"
  },
  "fontFamily": {
    "body-sm": [
      "Plus Jakarta Sans"
    ],
    "body-md": [
      "Plus Jakarta Sans"
    ],
    "label-sm": [
      "Plus Jakarta Sans"
    ],
    "headline-lg": [
      "Plus Jakarta Sans"
    ],
    "label-lg": [
      "Plus Jakarta Sans"
    ],
    "headline-md": [
      "Plus Jakarta Sans"
    ],
    "label-md": [
      "Plus Jakarta Sans"
    ],
    "headline-sm": [
      "Plus Jakarta Sans"
    ],
    "body-lg": [
      "Plus Jakarta Sans"
    ]
  },
  "fontSize": {
    "body-sm": [
      "12px",
      {
        "lineHeight": "18px",
        "fontWeight": "400"
      }
    ],
    "body-md": [
      "14px",
      {
        "lineHeight": "20px",
        "fontWeight": "400"
      }
    ],
    "label-sm": [
      "11px",
      {
        "lineHeight": "14px",
        "fontWeight": "500"
      }
    ],
    "headline-lg": [
      "30px",
      {
        "lineHeight": "38px",
        "fontWeight": "700"
      }
    ],
    "label-lg": [
      "14px",
      {
        "lineHeight": "20px",
        "fontWeight": "600"
      }
    ],
    "headline-md": [
      "24px",
      {
        "lineHeight": "32px",
        "fontWeight": "600"
      }
    ],
    "label-md": [
      "12px",
      {
        "lineHeight": "16px",
        "fontWeight": "600"
      }
    ],
    "headline-sm": [
      "20px",
      {
        "lineHeight": "28px",
        "fontWeight": "600"
      }
    ],
    "body-lg": [
      "16px",
      {
        "lineHeight": "24px",
        "fontWeight": "400"
      }
    ]
  }
};

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: prototipo,
  },
  plugins: [],
} satisfies Config;
