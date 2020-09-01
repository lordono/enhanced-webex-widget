import { constructHydraId, hydraTypes } from "@webex/react-component-utils";

export const eventNames = {
  SPACES_READ: "rooms:read",
  SPACES_UNREAD: "rooms:unread",
  SPACES_SELECTED: "rooms:selected",
  MESSAGES_CREATED: "messages:created",
  CALLS_CREATED: "calls:created",
  ACTION_CALL: "call",
  MEMBERSHIPS_CREATED: "memberships:created",
  MEMBERSHIPS_DELETED: "memberships:deleted",
  ADD_CLICKED: "add:clicked",
  PROFILE_CLICKED: "profile:clicked",
  USER_SIGNOUT_CLICKED: "user_signout:clicked"
};

/**
 * Constructs an event detail object for messages:created
 * @export
 * @param {Object} activity from mercury
 * @param {Object} toUser
 * @returns {Object} constructed event
 */
export function constructMessagesEventData(activity, toUser) {
  const roomType = activity.target.tags.includes("ONE_ON_ONE")
    ? "direct"
    : "group";
  let files, toPersonEmail, toPersonId;

  if (roomType === "direct" && toUser) {
    toPersonEmail = toUser.email;
    toPersonId = constructHydraId(hydraTypes.PEOPLE, toUser.id);
  }

  let mentionedPeople = activity.object.mentions;

  if (mentionedPeople && mentionedPeople.items.length) {
    mentionedPeople = mentionedPeople.items.map(people => ({
      id: constructHydraId(hydraTypes.PEOPLE, people.id)
    }));
  }

  // Files need to be decrypted and converted into a usable URL
  if (activity.object.files && activity.object.files.items.length) {
    files = activity.object.files.items;
  }

  const personId = constructHydraId(hydraTypes.PEOPLE, activity.actor.id);

  return {
    actorId: personId,
    id: constructHydraId(hydraTypes.MESSAGE, activity.id),
    roomId: constructHydraId(hydraTypes.ROOM, activity.target.id),
    roomType: activity.target.tags.includes("ONE_ON_ONE") ? "direct" : "group",
    text: activity.object.displayName,
    html: activity.object.content,
    files,
    personId,
    personEmail: activity.actor.emailAddress,
    created: activity.published,
    mentionedPeople,
    toPersonId,
    toPersonEmail
  };
}

export function constructRoomsEventData(space, activity) {
  return {
    id: constructHydraId(hydraTypes.ROOM, space.id),
    title: space.name,
    type: space.type,
    isLocked: space.isLocked,
    teamId: constructHydraId(hydraTypes.TEAM, space.teamId),
    lastActivity:
      (activity && activity.published) || space.lastActivityTimestamp,
    created: space.published,
    toPersonEmail: space.toPersonEmail,
    tags: space.tags,
    isMentionNotificationsOn: space.isMentionNotificationsOn,
    isMentionNotificationsOff: space.isMentionNotificationsOff,
    isMessageNotificationsOn: space.isMessageNotificationsOn,
    isMessageNotificationsOff: space.isMessageNotificationsOff
  };
}

export function constructMembershipEventData(activity) {
  return {
    actorId: constructHydraId(hydraTypes.PEOPLE, activity.actor.id),
    id: constructHydraId(hydraTypes.MESSAGE, activity.id),
    roomId: constructHydraId(hydraTypes.ROOM, activity.target.id),
    personId: constructHydraId(hydraTypes.PEOPLE, activity.object.id),
    personEmail: activity.object.emailAddress,
    created: activity.published
  };
}

export function constructCallEventData(call, space) {
  const event = {
    actorId: constructHydraId(hydraTypes.PEOPLE, call.locus.host.id),
    personId: constructHydraId(hydraTypes.PEOPLE, call.locus.host.id),
    personEmail: call.locus.host.email,
    call
  };

  if (space && space.id) {
    event.roomId = constructHydraId(hydraTypes.ROOM, space.id);
  }

  return event;
}
