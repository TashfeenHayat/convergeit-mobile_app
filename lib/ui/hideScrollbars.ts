/** Scrollable regions: keep scroll, hide scrollbar chrome (WebKit + Firefox + legacy Edge). */
export const hideScrollbarsSx = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  "&::-webkit-scrollbar": {
    display: "none",
    width: 0,
    height: 0,
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    display: "none",
    background: "transparent",
  },
  "&::-webkit-scrollbar-track": {
    display: "none",
    background: "transparent",
  },
} as const;
