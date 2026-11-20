import type { SiteConfig } from './domain';
export type EditorHistory = { past: SiteConfig[]; present: SiteConfig; future: SiteConfig[] };
export type HistoryAction =
  | { type: 'change'; value: SiteConfig | ((c: SiteConfig) => SiteConfig) }
  | { type: 'undo' | 'redo' }
  | { type: 'load'; value: SiteConfig };
export function editorHistory(state: EditorHistory, action: HistoryAction): EditorHistory {
  if (action.type === 'load') return { past: [], present: action.value, future: [] };
  if (action.type === 'undo')
    return state.past.length
      ? {
          past: state.past.slice(0, -1),
          present: state.past.at(-1)!,
          future: [state.present, ...state.future],
        }
      : state;
  if (action.type === 'redo')
    return state.future.length
      ? {
          past: [...state.past, state.present],
          present: state.future[0],
          future: state.future.slice(1),
        }
      : state;
  if (action.type === 'change') {
    const next = typeof action.value === 'function' ? action.value(state.present) : action.value;
    if (JSON.stringify(next) === JSON.stringify(state.present)) return state;
    return { past: [...state.past.slice(-79), state.present], present: next, future: [] };
  }
  return state;
}
