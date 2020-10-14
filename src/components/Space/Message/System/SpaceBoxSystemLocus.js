import React from "react";
import { useSelector } from "react-redux";
import { formatMsgTime } from "../../../formatDates";
import { SpaceBoxSystemMessage } from "./SpaceBoxSystemMessage";

export const SpaceBoxSystemLocus = ({ id, isSelf }) => {
  const activity = useSelector(s => s.activities.entities[id]);
  const actor = useSelector(s => s.users.entities[activity.actor]);

  const date = formatMsgTime(activity.published);

  const actorName = isSelf ? "You" : actor.displayName;

  let text = "System Message";
  // locus stuff
  const participants = activity.object.participants.items;
  const isGroupCall = activity.object.isGroupCall;
  const idles = participants.filter(i => i.state === "IDLE");
  const left = participants.filter(i => i.state === "LEFT");
  if (idles >= left) {
    if (isGroupCall) {
      text = `${actorName} started a meeting but no one was available - ${date}`;
    } else {
      let pronoun = "was";
      if (idles > 0) pronoun = "were";
      text = `${idles
        .map(i => i.person.displayName)
        .join(" and ")} ${pronoun} unavailable - ${date}`;
    }
  } else if (activity.object.duration) {
    text = `${actorName} had a call (${activity.object.duration} sec)`;
  }

  return <SpaceBoxSystemMessage text={text} />;
};
