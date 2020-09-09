import React from "react";
import { useSelector } from "react-redux";
import { formatUserMovement } from "../../../formatText";
import { SpaceBoxSystemMessage } from "./SpaceBoxSystemMessage";

export const SpaceBoxSystemUser = ({ id, isSelf }) => {
  const activity = useSelector(s => s.activities.entities[id]);
  const actor = useSelector(s => s.users.entities[activity.actor]);
  const target = useSelector(s => s.users.entities[activity.object.id]);

  const text = formatUserMovement(activity, isSelf, actor, target);

  return <SpaceBoxSystemMessage text={text} />;
};
