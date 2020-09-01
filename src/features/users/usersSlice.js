import { validateAndDecodeId } from "@webex/react-component-utils";
import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";

import { addAvatar } from "../avatars/avatarsSlice";
import { convertToSmallAvatar } from "../avatars/helpers";
import { constructUser, constructCurrentUser } from "./helpers";

const PENDING_STATUS = "PENDING";

const usersAdapter = createEntityAdapter();

const initialState = usersAdapter.getInitialState({
  currentUserId: null,
  byEmail: {}
});

export const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    addOne: (state, action) => {
      const { user } = action.payload;
      usersAdapter.addOne(state, user);
      state.byEmail[user.email] = user.id;
    },
    editOne: (state, action) => {
      const { user } = action.payload;
      state.byEmail[user.email] = user.id;
      state.entities[user.id] = user;
    },
    changeCurrent: (state, action) => {
      state.currentUserId = action.payload.id;
    },
    fetchUserRequest: (state, action) => {
      const { email, id } = action.payload;
      if (id && state.ids.includes(id)) {
        const userObject = {
          ...state.entities[id],
          status: { isFetching: true }
        };
        state.entities[id] = userObject;
      } else if (email) {
        state.byEmail[email] = id || PENDING_STATUS;
      }
    },
    fetchCurrentUserRequest: (state, action) => {
      const id = action.payload;
      state.currentUserId = id;
      if (id && state.ids.includes(id)) {
        const userObject = {
          ...state.entities[id],
          status: { isFetching: true }
        };
        state.entities[id] = userObject;
      }
    }
  }
});

const {
  addOne,
  // editOne,
  changeCurrent,
  fetchUserRequest,
  fetchCurrentUserRequest
} = usersSlice.actions;

export const storeUser = user => (dispatch, getState) => {
  const state = getState();
  const payload = { user: constructUser(user) };
  if (!state.users.ids.includes(user.id)) dispatch(addOne(payload));
  return Promise.resolve(user);
};

export const storeUsers = users => (dispatch, getState) => {
  const state = getState();
  users.forEach(user => {
    const payload = { user: constructUser(user) };
    if (!state.users.ids.includes(user.id)) dispatch(addOne(payload));
  });
  return Promise.resolve(users);
};

const storeCurrentUser = user => (dispatch, getState) => {
  const state = getState();
  const payload = { user: constructCurrentUser(user) };
  dispatch(changeCurrent({ id: payload.user.id }));
  if (!state.users.ids.includes(user.id)) dispatch(addOne(payload));
  // else dispatch(editOne(payload));
};

/**
 * Retrieves the current user using internal APIs
 * @param {Object} webex
 * @returns {Function}
 */
export const fetchCurrentUser = webex => (dispatch, getState) => {
  const { users } = getState();
  // Check for stored current User
  let userId = users.currentUserId;

  if (!webex) {
    return Promise.reject(
      new Error("webex instance is required to fetch current user")
    );
  }

  // Get userId from device registration
  if (!userId) {
    if (!(webex.internal.device && webex.internal.device.userId)) {
      return Promise.reject(
        new Error(
          "cannot retrieve current user. webex device is not registered."
        )
      );
    }
  }

  if (userId) {
    const currentUser = users.entities[userId];

    if (currentUser) {
      return Promise.resolve(currentUser);
    }
  }

  dispatch(fetchCurrentUserRequest(userId));

  return webex.internal.user.get().then(user => {
    dispatch(storeCurrentUser(user));
    if (user.photos && user.photos[0] && user.photos[0].url) {
      const { id: personId } = validateAndDecodeId(userId);

      dispatch(addAvatar(personId, convertToSmallAvatar(user.photos[0].url)));
    }
    return Promise.resolve(user);
  });
};

/**
 * Performs an API call to fetch and store user details
 * @param {Object} user
 * @param {String} user.email
 * @param {String} user.id
 * @param {Object} webex
 * @returns {Function}
 */
export const fetchUser = ({ email, id }, webex) => dispatch => {
  if (!webex) {
    return Promise.reject(
      new Error("webex instance is required to fetch users")
    );
  }

  const handleResponse = person => {
    dispatch(storeUser(person));
    const { id: personId } = validateAndDecodeId(person.id);

    dispatch(addAvatar(personId, convertToSmallAvatar(person.avatar)));

    return Promise.resolve(person);
  };

  if (email) {
    return webex.people
      .list({ email })
      .then(res => res.items[0])
      .then(handleResponse);
  }

  if (id) {
    return webex.people.get(id).then(handleResponse);
  }

  return Promise.reject(new Error("user email or id is required"));
};

/**
 * Retrieves user from store or makes an API call if it doesn't exist
 * @param {Object} user
 * @param {String} user.email
 * @param {String} user.id
 * @param {Object} webex
 * @returns {Function}
 */
export const getUser = ({ email, id }, webex) => (dispatch, getState) => {
  // Check if we've fetched or already fetched this user
  const { users } = getState();
  const userId = validateAndDecodeId(id).id || users.byEmail[email];

  if (userId) {
    const user = users.entities[userId];

    // If we've already fetched this user
    if (user) {
      // If we haven't finished getting the user
      if (user.status.isFetching) {
        return Promise.resolve();
      }

      return Promise.resolve(user);
    }
  }

  // Initiate an API call to get user
  dispatch(fetchUserRequest({ email, id: userId }));

  return dispatch(fetchUser({ email, id: userId }, webex));
};

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds
} = usersAdapter.getSelectors(state => state.users);

export const selectCurrentUser = state =>
  state.users.entities[state.users.currentUserId];

export default usersSlice.reducer;
