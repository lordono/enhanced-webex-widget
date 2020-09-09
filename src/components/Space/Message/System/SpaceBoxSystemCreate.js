import React from "react";
import { useSelector } from "react-redux";
import { formatMsgTime } from "../../../formatDates";
import { SpaceBoxSystemMessage } from "./SpaceBoxSystemMessage";

export const SpaceBoxSystemCreate = ({ id, isSelf }) => {
  const activity = useSelector(s => s.activities.entities[id]);
  const actor = useSelector(s => s.users.entities[activity.actor]);

  const date = formatMsgTime(activity.published);

  const actorName = isSelf ? "You" : actor.displayName;

  const text = `${actorName} started the conversation - ${date}`;

  return <SpaceBoxSystemMessage text={text} />;
};
