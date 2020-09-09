import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { initializeComposeSlice } from "./helpers";

const composeAdapter = createEntityAdapter();

const initialState = composeAdapter.getInitialState();

export const composeSlice = createSlice({
  name: "compose",
  initialState,
  reducers: {
    addOne: composeAdapter.addOne,
    updateOne: composeAdapter.upsertOne,
    removeOne: composeAdapter.removeOne,
    resetOne: (state, action) => {
      state.entities[action.payload] = initializeComposeSlice({
        id: action.payload
      });
    },
    reset: (state, action) => {
      state = initialState;
    }
  }
});

export const {
  addOne,
  updateOne,
  removeOne,
  resetOne,
  reset
} = composeSlice.actions;

export const addCompose = id => (dispatch, getState) => {
  const spaces = getState().spaces.ids;
  const composes = getState().compose.ids;
  if (spaces.includes(id) && !composes.includes(id)) {
    dispatch(addOne(initializeComposeSlice({ id })));
  }
};

export const updateCompose = compose => (dispatch, getState) => {
  const composes = getState().compose.ids;
  if (composes.includes(compose.id)) {
    dispatch(updateOne(compose));
  }
};

export const removeCompose = id => (dispatch, getState) => {
  const composes = getState().compose.ids;
  if (composes.includes(id)) {
    dispatch(removeOne(id));
  }
};

export const resetCompose = id => (dispatch, getState) => {
  const composes = getState().compose.ids;
  if (composes.includes(id)) {
    dispatch(resetOne(id));
  }
};

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllComposes,
  selectById: selectComposeById,
  selectIds: selectComposeIds
} = composeAdapter.getSelectors(state => state.compose);

export default composeSlice.reducer;
