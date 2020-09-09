import {
  createSlice,
  createEntityAdapter,
  createSelector
} from "@reduxjs/toolkit";

import { constructActivity, normalizeActivity } from "./helpers";
import { storeThread } from "../threads/threadsSlice";
import { storeReaction } from "../reactions/reactionsSlice";
import { storeUser } from "../users/usersSlice";

const activitiesAdapter = createEntityAdapter();

const initialState = activitiesAdapter.getInitialState();

export const activitiesSlice = createSlice({
  name: "activities",
  initialState,
  reducers: {
    addOne: activitiesAdapter.addOne,
    addMany: activitiesAdapter.addMany,
    updateOne: activitiesAdapter.upsertOne,
    updateMany: activitiesAdapter.upsertMany,
    removeOne: (state, action) => {
      activitiesAdapter.removeOne(state, action.payload.id);
    }
  }
});

export const {
  addOne,
  addMany,
  updateOne,
  updateMany,
  removeOne
} = activitiesSlice.actions;

export const storeActivities = activities => (dispatch, getState) => {
  const store = getState().activities;
  const activitiesToUpdate = [];
  const activitiesToAdd = [];
  const threadsToStore = [];
  activities.forEach(activity => {
    // handle reactions
    if (
      activity.verb === "add" &&
      activity.object &&
      activity.object.objectType === "reaction2Summary"
    ) {
      dispatch(storeReaction(activity));
    } else {
      const receivedActivity = normalizeActivity(activity);
      // handle any user activity by adding to store
      if (activity.object && activity.object.objectType === "person") {
        dispatch(storeUser(activity.object));
      }
      // handle if activity is a thread
      if (activity.activityType && activity.activityType === "reply") {
        threadsToStore.push(receivedActivity);
      }
      // check if we should add or update activties
      if (store.ids.includes(activity.id)) {
        activitiesToUpdate.push(constructActivity(receivedActivity));
      } else {
        activitiesToAdd.push(constructActivity(receivedActivity));
      }
    }
  });
  if (activitiesToUpdate.length) {
    dispatch(updateMany(activitiesToUpdate));
  }
  if (activitiesToAdd.length) {
    dispatch(addMany(activitiesToAdd));
  }
  if (threadsToStore.length) {
    threadsToStore.forEach(i => dispatch(storeThread(i)));
  }
  return Promise.resolve(activitiesToAdd.concat(activitiesToUpdate));
};

export const updateActivity = (id, updates) => (dispatch, getState) => {
  const activity = getState().activities.entities[id];
  const newActivity = Object.assign({}, activity, updates);
  dispatch(updateOne(newActivity));
};

export const deleteActivity = activity => dispatch => {
  dispatch(removeOne(constructActivity({ ...activity, verb: "tombstone" })));
};

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllActivities,
  selectEntities: selectActivitiesEntities,
  selectById: selectActivityById,
  selectIds: selectActivityIds
} = activitiesAdapter.getSelectors(state => state.activities);

export const selectActivitiesByIds = createSelector(
  [selectActivitiesEntities, (_, ids) => ids],
  (activities, ids) => {
    const filteredActivities = [];
    Object.keys(activities).forEach(i => {
      if (ids.includes(i)) filteredActivities.push(activities[i]);
    });
    return filteredActivities;
  }
);

export default activitiesSlice.reducer;
