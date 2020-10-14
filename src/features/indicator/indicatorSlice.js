import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";

const indicatorAdapter = createEntityAdapter();

const initialState = indicatorAdapter.getInitialState();

export const indicatorSlice = createSlice({
  name: "indicator",
  initialState,
  reducers: {
    add: indicatorAdapter.addOne,
    addUserToIndicator: (state, action) => {
      const { conversationId, actorId, date } = action.payload;
      const newUser = { id: actorId, date };
      state.entities[conversationId].typing = [
        newUser,
        ...state.entities[conversationId].typing
      ];
    },
    updateUserDate: (state, action) => {
      const { conversationId, userIndex, date } = action.payload;
      state.entities[conversationId].typing[userIndex].date = date;
    },
    remove: indicatorAdapter.removeOne
  }
});

export const {
  add,
  addUserToIndicator,
  updateUserDate,
  remove
} = indicatorSlice.actions;

export const storeIndicator = (conversationId, actorId) => (
  dispatch,
  getState
) => {
  // get current time
  const date = new Date().toISOString();
  const ids = getState().indicator.ids;
  if (ids.includes(conversationId)) {
    // add in actorId and keep it unique
    const typing = getState().indicator.entities[conversationId].typing;
    const findActorIndex = typing.findIndex(i => i.id === actorId);
    if (findActorIndex >= 0) {
      dispatch(
        updateUserDate({
          conversationId,
          userIndex: findActorIndex,
          date
        })
      );
    } else {
      dispatch(addUserToIndicator({ conversationId, actorId, date }));
    }
  } else {
    const typing = [{ id: actorId, date }];
    dispatch(add({ id: conversationId, typing }));
  }
};

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllIndicator,
  selectById: selectIndicatorById,
  selectIds: selectIndicatorIds
} = indicatorAdapter.getSelectors(state => state.indicator);

export default indicatorSlice.reducer;
