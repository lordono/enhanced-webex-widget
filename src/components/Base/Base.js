import React from "react";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";

import { useWebex } from "../../features/webex/useWebex";
import { useMercury } from "../../features/mercury/useMercury";
import { useCurrentUser } from "../../features/users/useCurrentUser";
import { useSetup } from "../../features/widgetRecents/useSetup";
import { useListeners } from "../../features/widgetRecents/useListeners";
import { changeMode } from "../../features/widgetBase/widgetBaseSlice";
import { getHuntingLines } from "../../features/hunting/huntingSlice";
import { getFilter } from "../../features/filterOrg/filterOrgSlice";
import "./Base.scss";

import { BaseMessage } from "./BaseMessage";
import { BaseMeeting } from "./BaseMeeting";
import { BaseHunting } from "./BaseHunting";
import { Loading } from "../Loading/Loading";
import LoadingSvg from "../../img/ellipsis.svg";

export const Base = ({ token, onEvent }) => {
  const dispatch = useDispatch();
  // mode represents the widget we are using - message/meeting
  const mode = useSelector(state => state.widgetBase.mode);

  // check if webex instance is created
  const webexState = useSelector(state => state.webex);
  const mercuryState = useSelector(state => state.mercury);
  const loadingText = () => {
    if (mercuryState.status.connecting) {
      return "Connecting to Webex";
    } else if (webexState.status.registering) {
      return "Registering Device";
    } else if (webexState.status.authenticating) {
      return "Authenticating Token";
    } else {
      return "Completed";
    }
  };

  // navigation
  const navClick = tab => dispatch(changeMode(tab));
  const navClass = tab => clsx("app-nav-tab", tab === mode && "selected");

  // series of custom hooks to initialize the widgets
  dispatch(getHuntingLines());
  dispatch(getFilter());
  useWebex(token);
  useCurrentUser();
  useMercury();
  useSetup();
  useListeners(onEvent);

  return (
    <main className="app-container">
      {(!webexState.status.registered || !mercuryState.status.connected) && (
        <Loading img={LoadingSvg} text={loadingText()} />
      )}
      {webexState.status.registered && mercuryState.status.connected && (
        <>
          <nav className="app-nav">
            <div
              className={navClass("message")}
              onClick={() => navClick("message")}
            >
              <ion-icon class="app-nav-tab-icon" name="chatbubbles" />
              <div className="app-nav-tab-title">Message</div>
            </div>
            <div
              className={navClass("meeting")}
              onClick={() => navClick("meeting")}
            >
              <ion-icon class="app-nav-tab-icon" name="videocam" />
              <div className="app-nav-tab-title">Video</div>
            </div>
            <div
              className={navClass("hunting")}
              onClick={() => navClick("hunting")}
            >
              <ion-icon class="app-nav-tab-icon" name="options" />
              <div className="app-nav-tab-title">Hunting</div>
            </div>
          </nav>
          <section className="app-content">
            {mode === "message" && <BaseMessage />}
            {mode === "hunting" && <BaseHunting />}
            <BaseMeeting mode={mode} />
          </section>
        </>
      )}
    </main>
  );
};
