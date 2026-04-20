import React, { createContext, useContext, useEffect, useState } from 'react';
import { DocumentMeta, documentService } from '../services/documentService';
import { useAuth } from '../hooks/useAuth';

type DocumentContextType = {
  documents: DocumentMeta[];
  vaultUsedBytes: number;
  loading: boolean;
};

export const DocumentContext = createContext<DocumentContextType>({ documents: [], vaultUsedBytes: 0, loading: true });

export const DocumentProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [vaultUsedBytes, setVaultUsedBytes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setVaultUsedBytes(0);
      setLoading(true);
      return;
    }

    // Fallback: If Firebase is unresponsive, clear loading after 4s
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    const unsubDocs = documentService.subscribeToDocuments(user.uid, (data) => {
      clearTimeout(loadingTimeout);
      setDocuments(data);
      setLoading(false);
    });
    
    const unsubVault = documentService.subscribeToVaultUsage(user.uid, (bytes) => {
      setVaultUsedBytes(bytes);
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubDocs();
      unsubVault();
    };
  }, [user]);

  return (
    <DocumentContext.Provider value={{ documents, vaultUsedBytes, loading }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => useContext(DocumentContext);
