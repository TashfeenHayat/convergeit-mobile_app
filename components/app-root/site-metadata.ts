import type { Metadata } from "next";

export const siteMetadata: Metadata = {
  title: "Converge",
  description: "Converge — dashboard and operations (Next.js App Router, TypeScript).",
  icons: {
    icon: [
      { url: "/assets/images/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/images/favicon.png", sizes: "592x592", type: "image/png" },
      { url: "/assets/images/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/assets/images/favicon-32.png",
    apple: [{ url: "/assets/images/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};
