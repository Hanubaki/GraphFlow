import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { multiplayerPresence, PeerPresence } from '../services/multiplayerPresence';

interface MultiplayerContextValue {
  peers: PeerPresence[];
  myPresence: PeerPresence;
  broadcastCursor: (worldX: number, worldY: number) => void;
  clearCursor: () => void;
  updateSelection: (nodeId: string | null) => void;
  totalCollaborators: number;
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

export const MultiplayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [peers, setPeers] = useState<PeerPresence[]>(() => multiplayerPresence.getRemotePeers());
  const [myPresence, setMyPresence] = useState<PeerPresence>(() => multiplayerPresence.getLocalPresence());

  useEffect(() => {
    const unsubscribe = multiplayerPresence.subscribe((updatedPeers) => {
      setPeers(updatedPeers);
      setMyPresence(multiplayerPresence.getLocalPresence());
    });
    return unsubscribe;
  }, []);

  const broadcastCursor = useCallback((worldX: number, worldY: number) => {
    multiplayerPresence.updateCursor(worldX, worldY);
  }, []);

  const clearCursor = useCallback(() => {
    multiplayerPresence.clearCursor();
  }, []);

  const updateSelection = useCallback((nodeId: string | null) => {
    multiplayerPresence.updateSelectedNode(nodeId);
    setMyPresence(multiplayerPresence.getLocalPresence());
  }, []);

  const value = useMemo<MultiplayerContextValue>(() => ({
    peers,
    myPresence,
    broadcastCursor,
    clearCursor,
    updateSelection,
    totalCollaborators: peers.length + 1,
  }), [peers, myPresence, broadcastCursor, clearCursor, updateSelection]);

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
};

export function useMultiplayer(): MultiplayerContextValue {
  const ctx = useContext(MultiplayerContext);
  if (!ctx) {
    // Graceful fallback if rendered outside provider (e.g. isolated test environments)
    const local = multiplayerPresence.getLocalPresence();
    return {
      peers: [],
      myPresence: local,
      broadcastCursor: () => {},
      clearCursor: () => {},
      updateSelection: () => {},
      totalCollaborators: 1,
    };
  }
  return ctx;
}
