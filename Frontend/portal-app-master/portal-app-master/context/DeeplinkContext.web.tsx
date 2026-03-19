import { createContext, type ReactNode, useContext } from 'react';

type DeeplinkContextType = {
  handleDeepLink: (_url: string) => void;
};

const DeeplinkContext = createContext<DeeplinkContextType | undefined>(undefined);

export const DeeplinkProvider = ({ children }: { children: ReactNode }) => {
  const handleDeepLink = (_url: string) => {
    // Deeplink parsing is intentionally disabled on web.
  };

  return (
    <DeeplinkContext.Provider value={{ handleDeepLink }}>{children}</DeeplinkContext.Provider>
  );
};

export const useDeeplink = (): DeeplinkContextType => {
  const context = useContext(DeeplinkContext);
  if (!context) {
    throw new Error('useDeeplink must be used within a DeeplinkProvider');
  }
  return context;
};
