import { createContext, type ReactNode, useContext, useMemo } from 'react';

type WebCashuWallet = {
  receiveToken: (token: string) => Promise<void>;
  getUnitInfo: () => Promise<{ title?: string } | null>;
  unit: () => string;
  getBalance: () => Promise<bigint>;
};

interface ECashContextType {
  wallets: { [key: string]: WebCashuWallet };
  isLoading: boolean;
  addWallet: (_mintUrl: string, _unit: string) => Promise<WebCashuWallet>;
  removeWallet: (_mintUrl: string, _unit: string) => Promise<void>;
  getWallet: (_mintUrl: string, _unit: string) => WebCashuWallet | null;
}

const WEB_UNSUPPORTED_ERROR =
  'eCash is not supported on web. Use an Android/iOS development build.';

const ECashContext = createContext<ECashContextType | undefined>(undefined);

export function ECashProvider({
  children,
}: {
  children: ReactNode;
  mnemonic: string;
  nsec: string;
}) {
  const contextValue = useMemo<ECashContextType>(
    () => ({
      wallets: {},
      isLoading: false,
      async addWallet() {
        throw new Error(WEB_UNSUPPORTED_ERROR);
      },
      async removeWallet() {
        throw new Error(WEB_UNSUPPORTED_ERROR);
      },
      getWallet() {
        return null;
      },
    }),
    []
  );

  return <ECashContext.Provider value={contextValue}>{children}</ECashContext.Provider>;
}

export function useECash() {
  const context = useContext(ECashContext);
  if (context === undefined) {
    throw new Error('useECash must be used within an ECashProvider');
  }
  return context;
}
