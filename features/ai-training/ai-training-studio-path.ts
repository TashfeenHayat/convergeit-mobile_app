/** Full-height flow builder — same main-column treatment as chat inbox. */
export function isDashboardAiTrainingStudioPath(pathname: string): boolean {
  return (
    pathname === "/dashboard/ai-training/chatbot/test" ||
    pathname === "/dashboard/ai-training/assistant/test"
  );
}
