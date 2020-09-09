import React, { useState } from "react";
import clsx from "clsx";
import { useSelector } from "react-redux";

import { SpaceBoxMessage } from "./Message/SpaceBoxMessage";
import { SpacePeople } from "./People/SpacePeople";

const Tab = ({ text, value, tab, setTab }) => {
  const tabClass = clsx("msg-header-tab", tab === value && "selected");
  return (
    <div className={tabClass} onClick={() => setTab(value)}>
      {text}
    </div>
  );
};

export const SpaceBox = ({ id }) => {
  const [tab, setTab] = useState("messages");
  const space = useSelector(state => state.spaces.entities[id]);
  const tabParams = { tab, setTab };
  const peopleText = `People ${space.participants.length}`;

  return (
    <>
      <div className="msg-header">
        <div className="msg-header-main">
          <div className="msg-header-toolkit"></div>
          <div className="msg-header-title">{space.displayName}</div>
          <div className="msg-header-meet">
            <ion-icon name="videocam-sharp"></ion-icon>
          </div>
        </div>
        <div className="msg-header-tabs">
          <Tab text="Messages" value="messages" {...tabParams} />
          <Tab text={peopleText} value="people" {...tabParams} />
        </div>
      </div>
      {tab === "messages" && <SpaceBoxMessage space={space} />}
      {tab === "people" && <SpacePeople space={space} />}
    </>
  );
};
