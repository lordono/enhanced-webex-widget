import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";

const threadsAdapter = createEntityAdapter();

const initialState = threadsAdapter.getInitialState();

export const threadsSlice = createSlice({
  name: "threads",
  initialState,
  reducers: {
    addOne: threadsAdapter.addOne,
    addMany: threadsAdapter.addMany,
    updateOne: threadsAdapter.upsertOne,
    updateMany: threadsAdapter.upsertMany,
    removeOne: (state, action) => {
      threadsAdapter.removeOne(state, action.payload.id);
    }
  }
});

export const {
  addOne,
  addMany,
  updateOne,
  updateMany,
  removeOne
} = threadsSlice.actions;

export const storeThread = activity => (dispatch, getState) => {
  const store = getState().threads;
  if (
    activity.activityType &&
    activity.activityType === "reply" &&
    activity.parent &&
    activity.parent.id
  ) {
    if (store.ids.includes(activity.parent.id)) {
      const currentThreads = store.entities[activity.parent.id].arrayIds;
      if (!currentThreads.includes(activity.id)) {
        const activityThreads = [activity.id, ...currentThreads];
        const activityPublished = [
          { id: activity.id, published: activity.published },
          ...store.entities[activity.parent.id].threads
        ];
        dispatch(
          updateOne({
            id: activity.parent.id,
            arrayIds: activityThreads,
            threads: activityPublished
          })
        );
      }
    } else {
      const activityThreads = [activity.id];
      const activityPublished = [
        { id: activity.id, published: activity.published }
      ];
      dispatch(
        addOne({
          id: activity.parent.id,
          arrayIds: activityThreads,
          threads: activityPublished
        })
      );
    }
  }
};

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllThreads,
  selectEntities: selectThreadsEntities,
  selectById: selectThreadById,
  selectIds: selectThreadIds
} = threadsAdapter.getSelectors(state => state.threads);

export default threadsSlice.reducer;
