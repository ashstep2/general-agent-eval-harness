/**
 * Judge model IDs as plain constants.
 *
 * Lives in its own file (with no other imports) so client components can read
 * these IDs without pulling the server-side model router into the client bundle.
 * The router transitively imports Node-only modules (child_process, fs) via the
 * Codex CLI adapter, which webpack refuses to bundle for the browser.
 */
export const JUDGE_MODELS = {
  primary: 'claude-sonnet-4-20250514',
  secondary: 'gpt-5.4',
} as const;
