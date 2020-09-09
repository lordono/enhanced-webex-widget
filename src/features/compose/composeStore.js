import React, { useState } from "react";

/**
 * Each space has its own activity.
 * This is meant to store the shareActivity object in Webex.
 * We will also store any text and html here too.
 */
export const ComposeContext = React.createContext(null);

export default ({ children }) => {
  const [composeStore, setComposeStore] = useState({});

  const updateComposeStore = (id, obj) => {
    setComposeStore(e => {
      const newComposerHash = { ...e };
      newComposerHash[id] = { ...(newComposerHash[id] || {}), ...obj };
      return newComposerHash;
    });
  };

  const store = { composeStore, updateComposeStore };

  return (
    <ComposeContext.Provider value={store}>{children}</ComposeContext.Provider>
  );
};
