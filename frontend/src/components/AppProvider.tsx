import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * A provider wrapping the whole app.
 *
 * You can add multiple providers here by nesting them,
 * and they will all be applied to the app.
 *
 * Theme is provided once, in AppWrapper (see constants/default-theme.ts),
 * so the toggle and the initial page load share a single source of truth.
 */
export const AppProvider = ({ children }: Props) => {
  return <>{children}</>;
};
