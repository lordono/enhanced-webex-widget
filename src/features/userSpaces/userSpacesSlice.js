import {
  createSlice,
  createEntityAdapter,
  createSelector
} from "@reduxjs/toolkit";

const userSpacesAdapter = createEntityAdapter();

const initialState = userSpacesAdapter.getInitialState();

export const userSpacesSlice = createSlice({
  name: "userSpaces",
  initialState,
  reducers: {
    addOne: userSpacesAdapter.addOne,
    updateOne: userSpacesAdapter.updateOne
  }
});

const { addOne, updateOne } = userSpacesSlice.actions;

export const storeUserSpaces = (user, space, room) => (dispatch, getState) => {
  const ids = getState().userSpaces.ids;
  const id = `${user}:${space}`;
  const props = { id, ...room };
  if (ids.includes(id)) dispatch(updateOne(props));
  else dispatch(addOne(props));
};

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllUserSpaces,
  selectIds: selectUserSpaceIds
} = userSpacesAdapter.getSelectors(state => state.userSpaces);

export const selectUserSpaceById = createSelector(
  [selectAllUserSpaces, (_, props) => props],
  (userSpaces, props) => {
    return userSpaces[`${props.userId}:${props.spaceId}`];
  }
);

export default userSpacesSlice.reducer;
