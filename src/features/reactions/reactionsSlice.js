import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";

import { constructReaction } from "./helpers";
import { parseISO, isAfter } from "date-fns";

const reactionsAdapter = createEntityAdapter();

const initialState = reactionsAdapter.getInitialState();

export const reactionsSlice = createSlice({
  name: "reactions",
  initialState,
  reducers: {
    addOne: reactionsAdapter.addOne,
    addMany: reactionsAdapter.addMany,
    updateOne: reactionsAdapter.upsertOne,
    updateMany: reactionsAdapter.upsertMany,
    removeOne: (state, action) => {
      reactionsAdapter.removeOne(state, action.payload.id);
    }
  }
});

export const {
  addOne,
  addMany,
  updateOne,
  updateMany,
  removeOne
} = reactionsSlice.actions;

export const storeReaction = activity => (dispatch, getState) => {
  const store = getState().reactions;
  if (
    activity.verb === "add" &&
    activity.object &&
    activity.object.objectType === "reaction2Summary"
  ) {
    if (!store.ids.includes(activity.parent.id)) {
      dispatch(addOne(constructReaction(activity)));
    } else {
      const currentPublished = store.entities[activity.parent.id].published;
      if (isAfter(parseISO(activity.published), parseISO(currentPublished))) {
        dispatch(updateOne(constructReaction(activity)));
      }
    }
  }
};

export const updateReactionFromMercury = activity => (dispatch, getState) => {
  const store = getState().reactions;
  if (
    activity.verb === "add" &&
    activity.object &&
    activity.object.objectType === "reaction2Summary"
  ) {
    if (store.ids.includes(activity.id)) {
      dispatch(updateOne(constructReaction(activity)));
    }
  }
};

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllReactions,
  selectEntities: selectReactionsEntities,
  selectById: selectReactionById,
  selectIds: selectReactionIds
} = reactionsAdapter.getSelectors(state => state.reactions);

export default reactionsSlice.reducer;
