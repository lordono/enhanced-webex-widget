import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { bufferToBlob } from "@webex/react-component-utils";

import { convertToSmallAvatar } from "./helpers";

const avatarsAdapter = createEntityAdapter();

const initialState = avatarsAdapter.getInitialState({
  avatarsInFlight: {}
});

export const avatarsSlice = createSlice({
  name: "avatars",
  initialState,
  reducers: {
    addOne: (state, action) => {
      const { id } = action.payload;
      avatarsAdapter.addOne(state, action.payload);
      delete state.avatarsInFlight[id];
    },
    addOneBegin: (state, action) => {
      const { id } = action.payload;
      state.avatarsInFlight[id] = true;
    }
  }
});

const { addOne, addOneBegin } = avatarsSlice.actions;

export const addAvatar = (id, avatar) => dispatch => {
  dispatch(addOne({ id, avatar }));
};

export const addAvatarBegin = id => dispatch => {
  dispatch(addOneBegin({ id }));
};

const fetchUserAvatar = (userId, webex) => dispatch => {
  dispatch(addAvatarBegin(userId));

  return webex.people
    .get(userId)
    .then(person => {
      const avatar = convertToSmallAvatar(person.avatar);

      dispatch(addAvatar(userId, avatar));

      return Promise.resolve(avatar);
    })
    .catch(() => {
      dispatch(addAvatar(userId, ""));

      return Promise.resolve({ id: userId });
    });
};

const fetchSpaceAvatar = (
  space,
  webexInstance,
  userIdForAvatar
) => dispatch => {
  if (space.type === "direct" && space.participants.length === 2) {
    if (!userIdForAvatar) {
      return Promise.reject(
        new Error("Direct spaces require a user id to display")
      );
    }

    return dispatch(fetchUserAvatar(userIdForAvatar, webexInstance));
  }
  if (space.avatar) {
    dispatch(addAvatarBegin(space.id));

    return webexInstance.internal.conversation
      .download(space.avatar.files.items[0])
      .then(file => {
        const { objectUrl } = bufferToBlob(file);

        dispatch(addAvatar(space.id, objectUrl));

        return Promise.resolve({ id: space.id });
      });
  }
  dispatch(addAvatar(space.id, ""));

  return Promise.resolve({ id: space.id });
};

/**
 * Fetches an avatar for a given space or user id
 * @param {Object} params
 * @param {Object} params.space
 * @param {String} params.userId
 * @param {Object} webex
 * @returns {Thunk}
 */
export const fetchAvatar = ({ space, userId }, webex) => (
  dispatch,
  getState
) => {
  const { avatars } = getState();
  const avatarId = space ? space.id : userId;
  const hasFetched = avatars.ids.includes(avatarId);
  const isFetching = Object.keys(avatars.avatarsInFlight).includes(avatarId);

  if (hasFetched) {
    return Promise.resolve(avatars.entities[avatarId]);
  }

  if (isFetching) {
    return Promise.resolve();
  }

  if (space) {
    return dispatch(fetchSpaceAvatar(space, webex, userId));
  }

  return dispatch(fetchUserAvatar(userId, webex));
};

/**
 * Fetches a group of users' avatars
 * @param {Array} userIds
 * @param {object} webex
 * @returns {Thunk}
 */
export const fetchAvatarsForUsers = (userIds, webex) => dispatch => {
  Promise.all(userIds.map(userId => dispatch(fetchAvatar({ userId }, webex))));
};

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllAvatars,
  selectById: selectAvatarById,
  selectIds: selectAvatarIds
} = avatarsAdapter.getSelectors(state => state.avatars);

export default avatarsSlice.reducer;
