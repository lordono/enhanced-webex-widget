import { createSlice } from "@reduxjs/toolkit";
import { fetchSpace, storeSpaces } from "../spaces/spacesSlice";
import { storeActivities } from "../activities/activitiesSlice";
import { updateStatus as updateRecentStatus } from "../widgetRecents/widgetRecentsSlice";

const initialState = {
  mode: "space",
  selectedSpace: null,
  creatingSpace: false,
  deletingActivityId: null,
  isListeningToActivity: false,
  isListeningToBufferState: false,
  isListeningToTyping: false,
  showAlertModal: false,
  showScrollToBottomButton: false,
  hasNewMessage: false,
  hasFetchedAdaptiveCardFeature: false
};

export const widgetMessageSlice = createSlice({
  name: "widgetMessage",
  initialState,
  reducers: {
    updateWidgetState: (state, action) => {
      for (let key of Object.keys(action.payload)) {
        state[key] = action.payload[key];
      }
    },
    resetWidgetMessage: state => (state = initialState)
  }
});

export const {
  updateWidgetState,
  resetWidgetMessage
} = widgetMessageSlice.actions;

export const chooseSpace = (webexInstance, filesStore, id, url) => (
  dispatch,
  getState
) => {
  // change selected space
  dispatch(
    updateWidgetState({
      selectedSpace: id,
      mode: "space",
      creatingSpace: false
    })
  );
  dispatch(updateRecentStatus({ mode: "spaces" }));
  // check if space has fetched activities
  const space = getState().spaces.entities[id];
  if (!space.hasFetchedActivities && !space.isFetchingActivities) {
    dispatch(fetchSpace(webexInstance, filesStore, { url, id }));
  }
};

export const createSpace = (
  webexInstance,
  filesStore,
  participants,
  displayName = null
) => dispatch => {
  // create space
  let params = { participants };
  let options = {};
  if (displayName) {
    params.displayName = displayName;
    options.forceGrouped = true;
  }

  dispatch(updateWidgetState({ mode: "space", creatingSpace: true }));

  return webexInstance.internal.conversation
    .create(params, options)
    .then(conversation => {
      dispatch(storeActivities(conversation.activities.items)).then(() => {
        dispatch(storeSpaces([conversation])).then(() =>
          dispatch(
            chooseSpace(
              webexInstance,
              filesStore,
              conversation.id,
              conversation.url
            )
          )
        );
      });
    });
};

// Export the customized selectors for this adapter using `getSelectors`
export const selectWidgetSpace = state => state.widgetSpace;

export default widgetMessageSlice.reducer;
