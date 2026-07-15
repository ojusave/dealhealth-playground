import { createTheme } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "indigo",
  defaultRadius: "md",
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  headings: {
    fontWeight: "600",
    sizes: {
      h1: { fontSize: "2rem", lineHeight: "1.2" },
      h2: { fontSize: "1.35rem", lineHeight: "1.3" },
      h3: { fontSize: "1.1rem", lineHeight: "1.35" },
    },
  },
  colors: {
    indigo: [
      "#eef2ff",
      "#e0e7ff",
      "#c7d2fe",
      "#a5b4fc",
      "#818cf8",
      "#6366f1",
      "#4f46e5",
      "#4338ca",
      "#3730a3",
      "#312e81",
    ],
    // Slate (Tailwind) replaces Mantine's neutral gray so light-mode component
    // surfaces (dropdowns, segmented tracks, switches, ring tracks, dimmed text)
    // pick up the app's blue-gray tint. Mantine light-scheme semantics:
    // gray-0 hover, gray-2/3 disabled/tracks, gray-4 default border,
    // gray-5 placeholder, gray-6 dimmed text.
    gray: [
      "#f8fafc",
      "#f1f5f9",
      "#e2e8f0",
      "#cbd5e1",
      "#94a3b8",
      "#64748b",
      "#475569",
      "#334155",
      "#1e293b",
      "#0f172a",
    ],
    // Blue-slate dark ramp anchored to the --dh-* shell tokens in index.css.
    // Mantine dark-scheme semantics: dark-0 text, dark-2 dimmed, dark-3
    // placeholder, dark-4 default border (--dh-border), dark-5 hover,
    // dark-6 control surface (--dh-surface-subtle), dark-7 body/popover bg
    // (--dh-surface), dark-8 inset/code bg (--dh-page-bg).
    dark: [
      "#c9d1de",
      "#98a2b3",
      "#6b7689",
      "#525e74",
      "#2c3340",
      "#242a36",
      "#1d222d",
      "#171b24",
      "#10131a",
      "#0b0e14",
    ],
  },
  components: {
    Card: {
      defaultProps: {
        shadow: "xs",
        withBorder: true,
      },
    },
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Badge: {
      defaultProps: {
        radius: "sm",
      },
    },
    Paper: {
      defaultProps: {
        radius: "md",
      },
    },
  },
});
