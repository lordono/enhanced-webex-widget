import {
  MENTION_NOTIFICATIONS_ON,
  MENTION_NOTIFICATIONS_OFF,
  MESSAGE_NOTIFICATIONS_ON,
  MESSAGE_NOTIFICATIONS_OFF,
  SPACE_TYPE_ONE_ON_ONE,
  SPACE_TYPE_GROUP,
  deconstructHydraId
} from "@webex/react-component-utils";

const TAG_ONE_ON_ONE = "ONE_ON_ONE";
const TAG_HIDDEN = "HIDDEN";

const widgetMessage = {
  scrolledBottom: false,
  windowHeight: 0,
  loadHistory: false,
  scrollTop: 0,
  initial: true,
  activitiesLength: 0
};

export const TAG_LOCKED = "LOCKED";

export function constructLastestActivity(items) {
  const latest = [...items].reverse().find(item => {
    if (
      item.verb === "add" &&
      item.object &&
      item.object.objectType === "reaction2Summary"
    ) {
      return false;
    } else {
      return ["tombstone", "delete"].indexOf(item.verb) === -1;
    }
  });

  return latest;
}

/**
 * Creates team object to be stored
 *
 * @param {Object} space
 * @param {Bool} isDecrypting
 * @returns {Object} formatted space object
 */
export function constructSpace(space, currentUserId) {
  const latestActivity = constructLastestActivity(space.activities.items);
  let avatar = null;
  if (space.avatar) {
    avatar = space.avatar.files.items[0].url;
  }

  const oneOnOneTag = "ONE_ON_ONE";
  const isOneOnOne = space.tags.some(tag => tag === oneOnOneTag);
  let displayName = space.displayName;
  let email = null;
  let otherUserId = null;
  if (isOneOnOne && !displayName) {
    const otherUser = space.participants.items.find(
      p => p.id !== currentUserId
    );

    if (otherUser) {
      displayName = otherUser.displayName;
      email = otherUser.emailAddress;
      otherUserId = otherUser.id;
    }
  }

  const currentUserParticipant = space.participants.items.find(
    participant => participant.id === currentUserId
  );
  const isModerator =
    currentUserParticipant &&
    currentUserParticipant.roomProperties &&
    currentUserParticipant.roomProperties.isModerator;

  let lastAcknowledgedActivityId = null;
  if (
    currentUserParticipant &&
    currentUserParticipant.roomProperties &&
    currentUserParticipant.roomProperties.lastSeenActivityUUID
  ) {
    lastAcknowledgedActivityId =
      currentUserParticipant.roomProperties.lastSeenActivityUUID;
  }

  // remove threads and reactions
  const activities = space.activities.items
    .filter(activity => {
      if (
        activity.verb === "add" &&
        activity.object &&
        activity.object.objectType === "reaction2Summary"
      ) {
        return false;
      } else if (activity.activityType && activity.activityType === "reply") {
        return false;
      } else {
        return true;
      }
    })
    .map(i => i.id);

  const s = {
    avatar,
    displayName,
    email,
    otherUserId,
    id: space.id,
    url: space.url,
    locusUrl: space.locusUrl,
    activities: activities,
    lastReadableActivityDate: space.lastReadableActivityDate,
    lastSeenActivityDate: space.lastSeenActivityDate,
    conversationWebUrl: space.conversationWebUrl,
    participants: space.participants.items,
    type: space.tags.includes(TAG_ONE_ON_ONE)
      ? SPACE_TYPE_ONE_ON_ONE
      : SPACE_TYPE_GROUP,
    published: space.published,
    tags: space.tags,
    isFetching: false,
    isFetchingActivities: false,
    hasFetchedActivities: false,
    meetingId: null,
    readReceipts: [],
    lastAcknowledgedActivityId,
    lastAcknowledgedCardActionActivity: null,
    isDecrypting: space.isDecrypting,
    defaultActivityEncryptionKeyUrl: space.defaultActivityEncryptionKeyUrl,
    encryptionKeyUrl: space.encryptionKeyUrl,
    kmsResourceObjectUrl: space.kmsResourceObjectUrl,
    isModerator,
    isOneOnOne,
    widgetMessage,
    isHidden: space.tags.includes(TAG_HIDDEN),
    isLocked: space.tags.includes(TAG_LOCKED),
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

  // Left spaces will still show up sometimes with empty activities
  if (!space.lastReadableActivityDate && space.published) {
    s.lastReadableActivityDate = space.published;
  }

  if (latestActivity) {
    s.latestActivity = latestActivity.id;
    // put in the read receipts here
    s.readReceipts = space.participants.items
      .filter(i => {
        if (i.roomProperties) {
          return i.roomProperties.lastSeenActivityUUID === latestActivity.id;
        } else return false;
      })
      .map(i => i.id);
  }

  if (space.team) {
    s.team = space.team.id;
  }

  return s;
}

export function constructSpaces(spaces, currentUserId) {
  return spaces.map(space => constructSpace(space, currentUserId));
}

/**
 * Converts a hydra room object to a conversation space object
 * (as much as possible)
 *
 * @param {object} room
 * @param {string} room.id ex: "Y2lzY29zcGFyazovL3VzL1JPT00vYmJjZWIxYWQtNDNmMS0zYjU4LTkxNDctZjE0YmIwYzRkMTU0"
 * @param {string} room.title ex: "Project Unicorn - Sprint 0"
 * @param {string} room.type ex: "group"
 * @param {string} room.isLocked ex: true
 * @param {string} room.teamId ex: "Y2lzY29zcGFyazovL3VzL1JPT00vNjRlNDVhZTAtYzQ2Yi0xMWU1LTlkZjktMGQ0MWUzNDIxOTcz"
 * @param {string} room.lastActivity ex: "2016-04-21T19:12:48.920Z"
 * @param {string} room.creatorId ex: "Y2lzY29zcGFyazovL3VzL1BFT1BMRS9mNWIzNjE4Ny1jOGRkLTQ3MjctOGIyZi1mOWM0NDdmMjkwNDY"
 * @param {string} room.created ex: "2016-04-21T19:01:55.966Z
 *
 * @returns {object} converted space object
 */
export function constructSpaceFromHydraRoom(room) {
  const team = room.teamId ? { id: deconstructHydraId(room.teamId).id } : "";
  const type =
    room.type === "direct" ? SPACE_TYPE_ONE_ON_ONE : SPACE_TYPE_GROUP;
  const tags = room.isLocked ? [TAG_LOCKED] : [];
  const space = {
    displayName: room.title,
    id: deconstructHydraId(room.id).id,
    lastReadableActivityDate: room.lastActivity,
    type,
    isDecrypting: false,
    team,
    activities: {
      items: []
    },
    participants: {
      items: []
    },
    tags
  };

  return space;
}

export function decryptSpace(space) {
  if (typeof space.decrypt === "function") {
    return space.decrypt().then(s => Promise.resolve(s));
  }

  return Promise.resolve(new Error("Space cannot be decrypted"));
}
