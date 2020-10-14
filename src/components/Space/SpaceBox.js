import React, { useState, useContext } from "react";
import clsx from "clsx";
import { useSelector, useDispatch } from "react-redux";

import { SpaceBoxMessage } from "./Message/SpaceBoxMessage";
import { SpacePeople } from "./People/SpacePeople";
import { MeetingContext } from "../../features/meeting/meetingStore";
import { updateCurrentMeeting } from "../../features/widgetMeeting/widgetMeetingSlice";
import { changeMode } from "../../features/widgetBase/widgetBaseSlice";

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
  const dispatch = useDispatch();
  const space = useSelector(state => state.spaces.entities[id]);
  const { meetingStore } = useContext(MeetingContext);
  const tabParams = { tab, setTab };
  const peopleText = `People ${space.participants.length}`;

  // video css and text depends if existing meeting is ongoing
  const hasCall = meetingStore[space.url];
  const videoCss = clsx("msg-header-meet", hasCall && "has-video");
  const videoText = hasCall ? "Join Meeting" : "Start Meeting";

  // joining video call
  const onVideoClick = () => {
    const created = hasCall ? true : false;
    dispatch(
      updateCurrentMeeting({
        spaceId: space.id,
        spaceUrl: space.url,
        created
      })
    ).then(results => {
      if (results.error) {
        alert(results.error);
      } else {
        dispatch(changeMode("meeting"));
      }
    });
  };

  return (
    <>
      <div className="msg-header">
        <div className="msg-header-main">
          <div className="msg-header-toolkit">
            <ion-icon name="chatbubble-ellipses" />
          </div>
          <div className="msg-header-title">{space.displayName}</div>
          <div className={videoCss} onClick={onVideoClick}>
            <ion-icon name="videocam" />
            <div className="msg-header-meet-title">{videoText}</div>
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
