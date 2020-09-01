import { toDate, isBefore } from "date-fns";

import {
  formatDate,
  MENTION_NOTIFICATIONS_ON,
  MENTION_NOTIFICATIONS_OFF,
  MESSAGE_NOTIFICATIONS_ON,
  MESSAGE_NOTIFICATIONS_OFF
} from "@webex/react-component-utils";

import { getToParticipant } from "./helpers";

export function constructSpace(space) {
  const { lastSeenActivityDate, lastReadableActivityDate, id } = space;
  const isUnread = lastSeenActivityDate
    ? isBefore(toDate(lastSeenActivityDate), toDate(lastReadableActivityDate))
    : true;

  return {
    id,
    locusUrl: space.locusUrl,
    type: space.type,
    lastActivityTime: formatDate(lastReadableActivityDate),
    lastActivityTimestamp: lastReadableActivityDate,
    name: "Untitled",
    participants: space.participants,
    published: space.published,
    isLocked: space.tags && space.tags.includes("LOCKED"),
    isUnread,
    isDecrypting: space.isDecrypting,
    tags: space.tags,
    isMentionNotificationsOn:
      space.tags && space.tags.includes(MENTION_NOTIFICATIONS_ON)
        ? true
        : undefined,
    isMentionNotificationsOff:
      space.tags && space.tags.includes(MENTION_NOTIFICATIONS_OFF)
        ? true
        : undefined,
    isMessageNotificationsOn:
      space.tags && space.tags.includes(MESSAGE_NOTIFICATIONS_ON)
        ? true
        : undefined,
    isMessageNotificationsOff:
      space.tags && space.tags.includes(MESSAGE_NOTIFICATIONS_OFF)
        ? true
        : undefined
  };
}

export function constructOneOnOne({ space, currentUser, users }) {
  const thisSpace = constructSpace(space);

  // Get the user ID of the participant that isn't current user
  let toPerson, toPersonId;

  const toParticipant = getToParticipant(space, currentUser.id);

  // Sometimes we have a direct convo with only one participant
  // (user has been deleted, etc)
  if (toParticipant) {
    toPersonId = toParticipant.id;
    toPerson = users.get(toPersonId);
  }

  if (toPerson) {
    thisSpace.toPersonId = toPersonId;
    thisSpace.toPersonEmail = toPerson.email;
    thisSpace.name = toPerson.displayName;
  }

  return thisSpace;
}

export function constructGroup({ space }) {
  const { displayName } = space;
  const thisSpace = constructSpace(space);

  thisSpace.name = displayName || "Untitled";

  return thisSpace;
}
