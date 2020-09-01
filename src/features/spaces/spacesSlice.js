import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { union } from "lodash";
import { isAfter, parseISO } from "date-fns";

import { add as addError } from "../errors/errorsSlice";
import { storeActivities } from "../activities/activitiesSlice";
import { storeUsers } from "../users/usersSlice";

import {
  TAG_LOCKED,
  decryptSpace,
  constructSpace,
  constructSpaces
} from "./helpers";
import { saveFileFromActivities } from "../files/filesStore";

// number of activities to pull for initialization
const activitiesLimit = 40;

// The options to pass to convo service when fetching multiple spaces (for recents)
const spacesConversationOptions = {
  uuidEntryFormat: true,
  personRefresh: true,
  isActive: true,
  lastViewableActivityOnly: false,
  participantAckFilter: "all",
  participantsLimit: -1,
  activitiesLimit: 0
};

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

export const storeInitialSpace = id => dispatch => {
  dispatch(addInitial({ id }));
};

export const updateSpaceRead = (spaceId, lastSeenDate) => dispatch => {
  dispatch(updateSpaceReadEvent({ lastSeenDate, spaceId }));
};

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
    readReceipts: [],
    isLocked: activity.object.tags && activity.object.tags.includes(TAG_LOCKED)
  };

  if (isSelf) {
    space.lastSeenActivityDate = activity.published;
  }

  if (isReadable) {
    space.lastReadableActivityDate = activity.published;
  }

  dispatch(updateSpace(space));
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
      // store users
      dispatch(storeUsers(fullSpace.participants.items));

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
 * Fetches spaces encrypted, stores encrypted spaces, then decrypts them.
 * This provides a better first time UX due to the fact that users can
 * see the decryption progress of each space.
 *
 * @export
 * @param {object} webexInstance
 * @param {object} [options={}]
 * @returns {function} thunk
 */
export const fetchSpacesEncrypted = (webexInstance, options = {}) => (
  dispatch,
  getState
) => {
  const currentUserId = getState().users.currentUserId;
  const listOptions = Object.assign(
    { deferDecrypt: true },
    spacesConversationOptions,
    options
  );

  return webexInstance.internal.conversation
    .list(listOptions)
    .then(items => {
      const spaces = items.map(space => {
        const decryptPromise = decryptSpace(space).then(decryptedSpace => {
          if (decryptedSpace) {
            const s = Object.assign({}, decryptedSpace, {
              isDecrypting: false
            });

            dispatch(storeSpaces([s]));

            return Promise.resolve(constructSpace(s, currentUserId));
          }

          return Promise.resolve(
            new Error("Space was not decrypted correctly")
          );
        });

        return Object.assign({}, space, {
          isDecrypting: true,
          decryptPromise
        });
      });

      dispatch(storeSpaces(spaces));

      return Promise.resolve(spaces);
    })
    .catch(err => {
      addLoadError(dispatch, err.name);

      throw err;
    });
};

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
export const fetchSpacesEncryptedPaginate = (
  webexInstance,
  options = {}
) => dispatch => {
  const listOptions = Object.assign(paginateOptions, options);

  return dispatch(fetchSpacesPaginateCall(webexInstance, listOptions));
};

/**
 * Fetches a list of spaces with options
 *
 * @export
 * @param {Object} webexInstance
 * @param {Object} options
 * @returns {Function} thunk
 */
export const fetchSpaces = (webexInstance, options = {}) => (
  dispatch,
  getState
) => {
  const currentUserId = getState().users.currentUserId;
  const listOptions = Object.assign({}, spacesConversationOptions, options);

  return webexInstance.internal.conversation
    .list(listOptions)
    .then(spaces => {
      dispatch(storeSpaces(spaces));

      const constructedSpaces = spaces.map(s =>
        constructSpace(s, currentUserId)
      );

      return Promise.resolve(constructedSpaces);
    })
    .catch(err => {
      addLoadError(dispatch, err.name);

      throw err;
    });
};

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllSpaces,
  selectById: selectSpaceById,
  selectIds: selectSpaceIds
} = spacesAdapter.getSelectors(state => state.spaces);

export default spacesSlice.reducer;
