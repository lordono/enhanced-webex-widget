import { formatMsgTime } from "./formatDates";

export const formatUserMovement = (activity, isSelf, actor, target) => {
  //  check if user conduct act on his own
  const selfExecute = activity.actor === activity.object.id;
  const formattedTime = formatMsgTime(activity.published);
  const actorName = isSelf ? "You" : actor.displayName;
  const targetName = target.displayName;

  if (activity.type === "leave" && selfExecute) {
    return `${targetName} left the space. ${formattedTime}`;
  } else if (activity.type === "leave") {
    return `${actorName} removed ${targetName} from this space. ${formattedTime}`;
  } else if (activity.type === "add") {
    return `${actorName} added ${targetName} to this space. ${formattedTime}`;
  }
};
