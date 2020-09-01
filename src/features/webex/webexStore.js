import React, { useState } from "react";

export const StoreContext = React.createContext(null);

export default ({ children }) => {
  const [webex, setWebex] = useState(null);

  const store = [webex, setWebex];

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};
