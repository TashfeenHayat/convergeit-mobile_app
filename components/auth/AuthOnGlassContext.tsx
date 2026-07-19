import { createContext, useContext } from 'react';

/** When true, auth UI sits on dark glass — use light text for contrast. */
export const AuthOnGlassContext = createContext(false);

export function useAuthOnGlass() {
  return useContext(AuthOnGlassContext);
}

export const authOnGlassText = {
  primary: 'rgba(255, 255, 255, 0.95)',
  secondary: 'rgba(255, 255, 255, 0.72)',
  placeholder: 'rgba(255, 255, 255, 0.45)',
  border: 'rgba(255, 255, 255, 0.55)',
} as const;
