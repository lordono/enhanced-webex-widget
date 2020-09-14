import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { union } from "lodash";
import { isAfter, parseISO } from "date-fns";

import { add as addError } from "../errors/errorsSlice";
import { storeActivities } from "../activities/activitiesSlice";
import { storeUsers } from "../users/usersSlice";

import { TAG_LOCKED, constructSpace, constructSpaces } from "./helpers";
import { saveFileFromActivities } from "../files/filesStore";
import { filterActivities } from "../activities/helpers";
import { addCompose } from "../compose/composeSlice";

// number of activities to pull for initialization
const activitiesLimit = 40;

const paginateOptions = {
  conversationsLimit: 50,
  personRefresh: false,
  paginate: true,
  participantsLimit: -1,
  participantAckFilter: "all",
  isActive: true,
  lastViewableActivityOnly: true
};

const spacesAdapter = createEntityAdapter({
  sortComparer: (a, b) => {
    return isAfter(
      parseISO(b.lastReadableActivityDate),
      parseISO(a.lastReadableActivityDate)
    )
      ? 1
      : -1;
  }
});

const initialState = spacesAdapter.getInitialState();

export const spacesSlice = createSlice({
  name: "spaces",
  initialState,
  reducers: {
    addSpace: spacesAdapter.addOne,
    addSpaces: (state, action) => {
      const spaces = action.payload;
      spaces.forEach(space => {
        if (state.ids.includes(space.id)) {
          spacesAdapter.upsertOne(state, space);
        } else {
          spacesAdapter.addOne(state, space);
        }
      });
    },
    removeSpace: spacesAdapter.removeOne,
    updateSpace: spacesAdapter.upsertOne,
    updateSpaces: spacesAdapter.upsertMany,
    addInitial: (state, action) => {
      const { id } = action.payload;
      const options = {
        id,
        isFetchingActivities: true
      };
      if (state.ids.includes(id)) {
        spacesAdapter.upsertOne(state, options);
      } else {
        spacesAdapter.addOne(state, { ...options, isFetching: true });
      }
    },
    addSpaceTags: (state, action) => {
      const { spaceId, tags } = action.payload;
      if (state.ids.includes(spaceId)) {
        const originalTags = state.entities[spaceId].tags;
        state.entities[spaceId].tags = union(originalTags, tags);
      }
    },
    removeSpaceTags: (state, action) => {
      const { spaceId, tags } = action.payload;
      if (state.ids.includes(spaceId)) {
        const modifiedTags = state.entities[spaceId].tags.filter(
          i => !tags.includes(i)
        );
        state.entities[spaceId].tags = modifiedTags;
      }
    },
    updateSpaceReadEvent: (state, action) => {
      const { lastSeenDate, spaceId } = action.payload;
      state.entities[spaceId].lastSeenActivityDate = lastSeenDate;
    }
  }
});

export const {
  addSpace,
  addSpaces,
  removeSpace,
  updateSpace,
  updateSpaces,
  addInitial,
  addSpaceTagsEvent,
  removeSpaceTagsEvent,
  updateSpaceReadEvent
} = spacesSlice.actions;

export const addSpaceTags = (spaceId, tags) => dispatch => {
  dispatch(addSpaceTagsEvent({ spaceId, tags }));
};

export const removeSpaceTags = (spaceId, tags) => dispatch => {
  dispatch(removeSpaceTagsEvent({ spaceId, tags }));
};

export const storeSpaces = (spaces, options = {}) => (dispatch, getState) => {
  const currentUserId = getState().users.currentUserId;
  const existingSpaceIds = getState().spaces.ids;
  const updateList = [];
  const addList = [];
  constructSpaces(spaces, currentUserId).forEach(space => {
    const formattedSpace = {
      ...space,
      participants: space.participants.map(i => i.id),
      ...options
    };
    if (existingSpaceIds.includes(space.id)) {
      updateList.push(formattedSpace);
    } else {
      addList.push(formattedSpace);
    }
  });
  if (updateList.length > 0) dispatch(updateSpaces(updateList));
  if (addList.length > 0) dispatch(addSpaces(addList));

  return Promise.resolve(addList.concat(updateList));
};

/**
 * Prior to fetching space, create this to initialize space in entities
 * @param {string} id spaceId
 */
export const storeInitialSpace = id => dispatch => {
  dispatch(addInitial({ id }));
};

/**
 * Update space with last seen date by current user
 * @param {string} spaceId
 * @param {string} lastSeenDate last seen date
 */
export const updateSpaceRead = (spaceId, lastSeenDate) => dispatch => {
  dispatch(updateSpaceReadEvent({ lastSeenDate, spaceId }));
};

/**
 * Function will update space with appropriate participants depending on action
 * If action is "add", it will add the actorId into the space.participants
 * If action is "leave", it'll remove the actorId in the space.participants
 *
 * @param {string} spaceId
 * @param {action} action this should be either "add" or "leave"
 * @param {string} actorId
 */
export const updateSpacewithParticipants = (spaceId, action, actorId) => (
  dispatch,
  getState
) => {
  const currentSpace = getState().spaces.entities[spaceId];
  const currentParticipants = currentSpace.participants;
  if (action === "add") {
    const updatedParticipants = [...currentParticipants, actorId];
    dispatch(updateSpace({ id: spaceId, participants: updatedParticipants }));
  } else if (action === "leave") {
    const updatedParticipants = [...currentParticipants];
    const removedParticipantId = updatedParticipants.findIndex(
      i => i === actorId
    );
    updatedParticipants.splice(removedParticipantId, 1);
    dispatch(updateSpace({ id: spaceId, participants: updatedParticipants }));
  }
};

/**
 * Adds a rate limit error to the errors module
 * @param {function} dispatch
 * @param {String} name
 */
function addLoadError(dispatch, name) {
  dispatch(
    addError({
      code: name,
      id: "redux-module-spaces-load",
      displayTitle: "Something's not right",
      displaySubtitle: `Unable to load spaces. Please try again later. [${name}]`,
      temporary: false
    })
  );
}

/**
 * Updates the target space with incoming acknowledgement for read receipt
 *
 * @param {String} spaceId space ID
 * @param {String} activityId Latest activity of user
 * @param {String} actorId Actor ID
 */
export const updateSpaceWithReceipts = (spaceId, activityId, actorId) => (
  dispatch,
  getState
) => {
  const targetSpace = getState().spaces.entities[spaceId];
  const readReceipts = [...targetSpace.readReceipts];
  if (activityId === targetSpace.latestActivity) {
    readReceipts.push(actorId);
  }
  dispatch(updateSpace({ id: spaceId, readReceipts }));
};

/**
 * Updates the target space with incoming Mercury activity
 *
 * @export
 * @param {Object} activity
 * @param {Boolean} isSelf if actor is the same as this user
 * @param {Boolean} isReadable if the activity is a readable activity
 * @returns {Object} action
 */
export const updateSpaceWithActivity = (
  activity,
  isSelf,
  isReadable = false
) => (dispatch, getState) => {
  const targetSpace = getState().spaces.entities[activity.target.id];

  // We update lastReadableActivityDate, and the activity attached to this Space
  const space = {
    id: activity.target.id,
    activities: targetSpace.activities.concat(activity.id),
    latestActivity: activity.id,
    isLocked: activity.object.tags && activity.object.tags.includes(TAG_LOCKED)
  };

  if (isSelf) {
    space.lastSeenActivityDate = activity.published;

    // handle to remove temp message
    if (activity.clientTempId) {
      const index = space.activities.findIndex(
        i => i === activity.clientTempId
      );
      if (index >= 0) {
        space.activities.splice(index, 1);
      }
    }
  }

  if (isReadable) {
    space.lastReadableActivityDate = activity.published;
    space.readReceipts = [];
  }

  dispatch(updateSpace(space));

  return Promise.resolve(space);
};

/**
 * Fetches single space from server
 *
 * @export
 * @param {Object} webexInstance
 * @param {Object} space - represents the space to fetch.
 *   Contains a 'url' or an 'id' and 'cluster'
 * @returns {function} thunk
 */
export const fetchSpace = (webexInstance, filesStore, space) => (
  dispatch,
  getState
) => {
  const currentUserId = getState().users.currentUserId;
  dispatch(storeInitialSpace(space.id));

  return webexInstance.internal.conversation
    .get(space, {
      activitiesLimit,
      participantsLimit: -1,
      participantAckFilter: "all",
      includeParticipants: true,
      latestActivity: true
    })
    .then(fullSpace => {
      // initialize compose
      dispatch(addCompose(fullSpace.id));

      // store users
      dispatch(storeUsers(fullSpace.participants.items));

      fullSpace.activities.items = filterActivities(fullSpace.activities.items);

      // store images
      fullSpace.activities.items.forEach(item =>
        saveFileFromActivities(webexInstance, filesStore, item)
      );

      // store activities
      dispatch(storeActivities(fullSpace.activities.items)).then(() => {
        // store spaces
        dispatch(
          storeSpaces([fullSpace], {
            isFetching: false,
            isFetchingActivities: false,
            hasFetchedActivities: true
          })
        );
      });
      return Promise.resolve(constructSpace(fullSpace, currentUserId));
    })
    .catch(err => {
      addLoadError(dispatch, err.name);
      throw err;
    });
};

/**
 * Recursive callback to webex to get all spaces with last activity
 * @param {webex} webexInstance
 * @param {object} options
 */
const fetchSpacesPaginateCall = (webexInstance, options = {}) => (
  dispatch,
  getState
) => {
  const currentUserId = getState().users.currentUserId;
  return webexInstance.internal.conversation
    .paginate(options)
    .then(results => {
      const spaces = results.page.items;
      const links = results.page.links;

      spaces.forEach(space => {
        dispatch(storeActivities(space.activities.items));
        dispatch(storeUsers(space.participants.items));
      });
      dispatch(
        storeSpaces(spaces, {
          isFetching: false,
          isFetchingActivities: false,
          hasFetchedActivities: false
        })
      );

      const constructedSpaces = spaces.map(s =>
        constructSpace(s, currentUserId)
      );

      if (Object.keys(links).length > 0) {
        return dispatch(
          fetchSpacesPaginateCall(webexInstance, { page: results.page })
        ).then(additionalSpaces =>
          Promise.resolve(constructedSpaces.concat(additionalSpaces))
        );
      } else {
        return Promise.resolve(constructedSpaces);
      }
    })
    .catch(err => {
      addLoadError(dispatch, err.name);
      throw err;
    });
};

/**
 * Fetches spaces encrypted, stores encrypted spaces, then decrypts them.
 * This provides a better first time UX due to the fact that users can
 * see the decryption progress of each space.
 *
 * @export
 * @param {object} webexInstance
 * @param {object} [options={}]
 * @returns {function} thunk
 */
export const fetchSpacesPaginate = (
  webexInstance,
  options = {}
) => dispatch => {
  const listOptions = Object.assign(paginateOptions, options);

  return dispatch(fetchSpacesPaginateCall(webexInstance, listOptions));
};

/**
 * Loads activities for a conversation previous to the maxDate
 *
 * @export
 * @param {object} space
 * @param {string} maxDate
 * @param {object} webex
 * @param {object} filesStore
 * @returns {function}
 */
export const loadPreviousMessages = (space, maxDate, webex, filesStore) => (
  dispatch,
  getState
) => {
  const { id, url } = space;
  return webex.internal.conversation
    .listActivities({
      conversationUrl: url,
      lastActivityFirst: true,
      limit: 20,
      maxDate: Date.parse(maxDate) || Date.now()
    })
    .then(activities => {
      const filteredActivities = filterActivities(activities);

      // store images
      filteredActivities.forEach(item =>
        saveFileFromActivities(webex, filesStore, item)
      );

      // store activities
      dispatch(storeActivities(filteredActivities)).then(storedActivities => {
        // store spaces
        const spaceActivities = getState().spaces.entities[id].activities;
        dispatch(
          updateSpace({
            id,
            activities: [
              ...new Set([
                ...storedActivities.map(i => i.id),
                ...spaceActivities
              ])
            ]
          })
        );
      });
      return Promise.resolve(filteredActivities);
    });
};

/**
 * Acknowledges (marks as read) an activity
 * @param {object} conversation (immutable object expected)
 * @param {object} activity
 * @param {object} spark
 * @returns {function}
 */
export const acknowledgeActivityOnServer = (
  webex,
  space,
  activity
) => dispatch => {
  webex.internal.conversation
    .acknowledge(space, activity)
    .then(() =>
      dispatch(
        updateSpace({ id: space.id, lastAcknowledgedActivityId: activity.id })
      )
    );
};

/**
 * Update any widgetmessage options in given space
 * scrolledBottom
 * windowHeight
 * loadHistory
 * scrollTop
 * initial
 * activitiesLength
 * @param {string} id Space ID
 * @param {object} widgetOptions Widget Message's Options to be upserted
 */
export const updateWidgetInSpace = (id, widgetOptions) => (
  dispatch,
  getState
) => {
  const widgetMessage = getState().spaces.entities[id].widgetMessage;
  dispatch(
    updateSpace({
      id,
      widgetMessage: { ...widgetMessage, ...widgetOptions }
    })
  );
};

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllSpaces,
  selectById: selectSpaceById,
  selectIds: selectSpaceIds
} = spacesAdapter.getSelectors(state => state.spaces);

export default spacesSlice.reducer;
