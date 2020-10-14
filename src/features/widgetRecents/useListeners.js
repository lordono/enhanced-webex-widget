import { useEffect, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  // API_ACTIVITY_TYPE,
  API_ACTIVITY_VERB,
  SPACE_TYPE_ONE_ON_ONE
} from "@webex/react-component-utils";

import { StoreContext } from "../webex/webexStore";
import { updateStatus as updateWidgetStatus } from "./widgetRecentsSlice";
import {
  storeActivities,
  updateActivity,
  removeOne as removeActivity
} from "../activities/activitiesSlice";
import {
  addSpaceTags,
  fetchSpace,
  removeSpace,
  removeSpaceTags,
  updateSpaceWithActivity,
  updateSpaceWithReceipts,
  updateSpaceRead,
  updateSpacewithParticipants
} from "../spaces/spacesSlice";
import { storeUser } from "../users/usersSlice";

import { eventNames } from "./events";
import { getToParticipant, getSpaceAvatar } from "./helpers";
import { FilesContext, saveFileFromActivities } from "../files/filesStore";
import { MeetingContext } from "../meeting/meetingStore";
import { storeIndicator } from "../indicator/indicatorSlice";

/**
 * Event handler that logs data then sends to the onEvent function
 *
 * @param {String} name
 * @param {Object} data
 * @param {Object} props
 */
const handleEvent = (name, data, activity, onEvent) => {
  if (typeof onEvent === "function") {
    onEvent({ name, data, activity });
  }
};

/**
 * Processes a space activity as it comes in via websocket
 *
 * Expects a space to have been loaded for the given activity
 *
 * @param {Object} activity
 * @param {Object} space
 * @param {Object} props
 */
const processActivity = (
  activity,
  space,
  users,
  webex,
  filesStore,
  onEvent = null
) => (dispatch, getState) => {
  const spacesList = getState().spaces.entities;

  dispatch(storeActivities([activity]));
  const currentUserId = getState().users.currentUserId;
  const isSelf = activity.actor.id === currentUserId;
  const formattedSpace = spacesList[space.id];

  switch (activity.verb) {
    case API_ACTIVITY_VERB.SHARE:
    case API_ACTIVITY_VERB.POST: {
      const otherParticipant =
        !!space.participants &&
        typeof space.participants.find === "function" &&
        space.participants.find(p => p.id !== currentUserId);
      const otherParticipantId = otherParticipant && otherParticipant.id;
      const otherUser = users.entities[otherParticipantId];

      // Update space with newest post activity
      dispatch(updateSpaceWithActivity(activity, isSelf, true)).then(() => {
        // remove temp message if there is.
        if (isSelf && activity.clientTempId) {
          dispatch(removeActivity({ id: activity.clientTempId }));
        }
      });

      // Store files
      saveFileFromActivities(webex, filesStore, activity);

      // Do not emit unread if current user created the message
      if (!isSelf && formattedSpace) {
        handleEvent(
          eventNames.SPACES_UNREAD,
          formattedSpace,
          activity,
          onEvent
        );
      }
      // Emit message:created event
      handleEvent(eventNames.MESSAGES_CREATED, otherUser, activity, onEvent);
      break;
    }
    case API_ACTIVITY_VERB.UPDATE: {
      // handle locusSessions information - update
      if (activity.object.objectType === "locusSessionSummary") {
        dispatch(updateSpaceWithActivity(activity, isSelf, true));
      }
      break;
    }
    case API_ACTIVITY_VERB.LOCK:
    case API_ACTIVITY_VERB.UNLOCK: {
      dispatch(updateSpaceWithActivity(activity, isSelf));
      break;
    }
    case API_ACTIVITY_VERB.ACKNOWLEDGE: {
      dispatch(
        updateSpaceWithReceipts(
          formattedSpace.id,
          activity.object.id,
          activity.actor.id
        )
      );
      if (isSelf && formattedSpace) {
        // update space with last acknowledgment if it's this user
        dispatch(updateSpaceRead(activity.target.id, activity.published));

        handleEvent(eventNames.SPACES_READ, formattedSpace, activity, onEvent);
      }
      break;
    }
    case API_ACTIVITY_VERB.CREATE: {
      const constructedActivity = Object.assign({}, activity, {
        target: activity.object,
        object: {
          id: activity.actor.id,
          emailAddress: activity.actor.emailAddress
        }
      });

      handleEvent(
        eventNames.MEMBERSHIPS_CREATED,
        null,
        constructedActivity,
        onEvent
      );
      break;
    }
    case API_ACTIVITY_VERB.ADD: {
      if (activity.object.objectType === "person") {
        dispatch(storeUser(activity.object));
        dispatch(
          updateSpacewithParticipants(space.id, "add", activity.object.id)
        );
        // Update space with newest membership activity
        dispatch(updateSpaceWithActivity(activity, isSelf, true));
      }
      handleEvent(eventNames.MEMBERSHIPS_CREATED, null, activity, onEvent);
      break;
    }
    case API_ACTIVITY_VERB.LEAVE: {
      if (activity.object.objectType === "person") {
        dispatch(
          updateSpacewithParticipants(space.id, "leave", activity.object.id)
        );
        // Update space with newest membership activity
        dispatch(updateSpaceWithActivity(activity, isSelf, true));
      }
      // dispatch(removeSpace(space.id));
      handleEvent(eventNames.MEMBERSHIPS_DELETED, null, activity, onEvent);
      break;
    }
    case API_ACTIVITY_VERB.HIDE: {
      dispatch(removeSpace(space.id));
      break;
    }
    case API_ACTIVITY_VERB.TAG: {
      dispatch(addSpaceTags(space.id, activity.object.tags));
      break;
    }

    case API_ACTIVITY_VERB.UNTAG: {
      dispatch(removeSpaceTags(space.id, activity.object.tags));
      break;
    }
    default:
  }
};

/**
 * Handles the initial processing of new activity coming in via websocket
 *
 * @param {Object} activity
 */
const handleNewActivity = (activity, webexInstance, filesStore, onEvent) => (
  dispatch,
  getState
) => {
  const { users, spaces, activities } = getState();

  const space = activity.target || activity.object;
  let spaceId = space && space.id;

  // On delete, refetch space to get previous activity
  if (spaceId && ["delete", "tombstone"].includes(activity.verb)) {
    if (activities.ids.includes(activity.id)) {
      dispatch(updateActivity(activity.id, { type: "tombstone" }));
    }
  }

  // Handle spaceId if this is a completely new space or hiding a space
  if (!spaceId && ["create", "hide"].includes(activity.verb)) {
    spaceId = activity.object.id;
  }

  const cachedSpace = spaces.entities[spaceId];

  if (cachedSpace) {
    dispatch(
      processActivity(
        activity,
        cachedSpace,
        users,
        webexInstance,
        filesStore,
        onEvent
      )
    );
  } else {
    // go retrieve the space if it doesn't exist
    dispatch(fetchSpace(webexInstance, filesStore, space)).then(newSpace => {
      if (newSpace) {
        dispatch(
          processActivity(activity, newSpace, users, webexInstance, filesStore)
        );
        dispatch(getSpaceAvatar(newSpace, webexInstance));

        // Store user for 1:1 spaces
        if (newSpace.type === SPACE_TYPE_ONE_ON_ONE) {
          const toUser = getToParticipant(newSpace, users.currentUserId);

          if (toUser) {
            dispatch(storeUser(toUser));
          }
        }
      }
    });
  }
};

export const useListeners = onEvent => {
  const [webexInstance] = useContext(StoreContext);
  const filesStore = useContext(FilesContext);
  const { meetingStore, updateMeeting, removeMeeting } = useContext(
    MeetingContext
  );
  const currentUser = useSelector(state => state.users.currentUserId);
  const widgetStatus = useSelector(state => state.widgetRecents.status);
  const dispatch = useDispatch();

  useEffect(() => {
    // Listen for new conversation activity
    if (currentUser && !widgetStatus.isListeningForNewActivity) {
      dispatch(updateWidgetStatus({ isListeningForNewActivity: true }));

      // listen to activity events
      webexInstance.internal.mercury.on("event:conversation.activity", event =>
        dispatch(
          handleNewActivity(
            event.data.activity,
            webexInstance,
            filesStore,
            onEvent
          )
        )
      );

      // listen to typing events
      webexInstance.internal.mercury.on("event:status.start_typing", event =>
        dispatch(
          storeIndicator(event.data.conversationId, event.data.actor.entryUUID)
        )
      );

      // listen to locus events
      webexInstance.meetings.listenForEvents();
      webexInstance.meetings.registered = true;

      // get all existing meetings
      // webexInstance.meetings.syncMeetings().then(() => {
      //   // Existing meetings live in the meeting collection
      //   const existingMeetings = webexInstance.meetings.getAllMeetings();
      //   console.log(existingMeetings);
      // });

      // Listen for added meetings
      console.log("listening to meeting events");
      webexInstance.meetings.on("meeting:added", addedMeetingEvent => {
        console.log("cic-logger: meeting added - ", addedMeetingEvent);
        if (["INCOMING", "JOIN"].includes(addedMeetingEvent.type)) {
          const { meeting } = addedMeetingEvent;
          updateMeeting(meeting.conversationUrl, {
            ...addedMeetingEvent
          });
        }
      });
      webexInstance.meetings.on("meeting:removed", removedMeetingEvent => {
        console.log("cic-logger: meeting removed - ", removedMeetingEvent);
        const { meetingId } = removedMeetingEvent;
        removeMeeting(meetingId);
      });
    }
  }, [
    dispatch,
    webexInstance,
    currentUser,
    filesStore,
    meetingStore,
    updateMeeting,
    removeMeeting,
    widgetStatus.isListeningForNewActivity,
    onEvent
  ]);
};
