import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { removeCurrentMeeting } from "../widgetMeeting/widgetMeetingSlice";

/**
 * Each space has its own meeting.
 * This is meant to store the meeting object in Webex.
 * We will also store any text and html here too.
 */
export const MeetingContext = React.createContext(null);

export default ({ children }) => {
  const dispatch = useDispatch();
  const [meetingStore, setMeetingStore] = useState({});

  const updateMeeting = (id, obj) => {
    setMeetingStore(e => {
      const newMeetingHash = { ...e };
      newMeetingHash[id] = { ...(newMeetingHash[id] || {}), ...obj };
      return newMeetingHash;
    });
  };

  const removeMeeting = id => {
    console.log("cic-logger:removing meeting", id);
    setMeetingStore(e => {
      const newMeetingHash = { ...e };
      const deletedMeeting = Object.values(newMeetingHash).find(
        i => i.meeting.id === id
      );
      if (deletedMeeting) {
        dispatch(removeCurrentMeeting(deletedMeeting.meeting.conversationUrl));
        delete newMeetingHash[deletedMeeting.meeting.conversationUrl];
      }
      return newMeetingHash;
    });
  };

  const store = { meetingStore, updateMeeting, removeMeeting };

  return (
    <MeetingContext.Provider value={store}>{children}</MeetingContext.Provider>
  );
};
