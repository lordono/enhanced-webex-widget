import React from "react";
import { useSelector } from "react-redux";
import { useWebex } from "../../features/webex/useWebex";
import { useMercury } from "../../features/mercury/useMercury";
import { useCurrentUser } from "../../features/users/useCurrentUser";
import { useSetup } from "../../features/widgetRecents/useSetup";
import { useListeners } from "../../features/widgetRecents/useListeners";
import "./Base.scss";

import { Recent } from "../Recent/Recent";
import { Space } from "../Space/Space";

export const Base = ({ token, onEvent }) => {
  const widgetStatus = useSelector(state => state.widgetRecents.status);
  useWebex(token);
  useCurrentUser();
  useMercury();
  useSetup();
  useListeners(onEvent);

  return (
    <main className="App-chat">
      {widgetStatus.hasFetchedInitialSpaces && (
        <>
          <Recent />
          <Space />
        </>
      )}
    </main>
  );
};
