import React, { createContext, useContext, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { RPC_ENDPOINT } from "@/lib/solana";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletContextType {
  connected: boolean;
}

const WalletContextInternal = createContext<WalletContextType | undefined>(
  undefined
);

export const useWalletContext = () => {
  const context = useContext(WalletContextInternal);
  if (!context) {
    throw new Error(
      "useWalletContext must be used within WalletContextProvider"
    );
  }
  return context;
};

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: React.FC<WalletContextProviderProps> = ({
  children,
}) => {
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletContextInternal.Provider value={{ connected: true }}>
            {children}
          </WalletContextInternal.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
