import { createSlice } from "@reduxjs/toolkit";
import { fetchSpace, storeSpaces } from "../spaces/spacesSlice";
import { storeActivities } from "../activities/activitiesSlice";

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
  scrollPosition: {},
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
    setScrollPosition: (state, action) => {
      state.scrollPosition = action.payload;
    },
    resetWidgetMessage: state => (state = initialState)
  }
});

export const {
  updateWidgetState,
  setScrollPosition,
  resetWidgetMessage
} = widgetMessageSlice.actions;

export const showScrollToBottomButton = isVisible => dispatch => {
  dispatch(
    updateWidgetState({
      showScrollToBottomButton: isVisible
    })
  );
};

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

/**
 * Sets if the widget has been scrolled up from the bottom
 *
 * @export
 * @param {boolean} isScrolledUp
 * @returns {Thunk}
 */
export const setScrolledUp = isScrolledUp => (dispatch, getState) => {
  const { widgetMessage } = getState();

  // Since we are triggering this every scroll, let's not attack
  // our store if we don't need to
  if (!isScrolledUp) {
    /* eslint-disable operator-linebreak */
    if (
      widgetMessage.hasNewMessage ||
      widgetMessage.hasScrolledUp ||
      widgetMessage.showScrollToBottomButton
    ) {
      dispatch(
        updateWidgetState({
          hasNewMessage: false,
          hasScrolledUp: false,
          showScrollToBottomButton: false
        })
      );
    }
  } else if (
    /* eslint-disable operator-linebreak */
    !widgetMessage.hasScrolledUp ||
    !widgetMessage.showScrollToBottomButton
  ) {
    dispatch(
      updateWidgetState({
        hasScrolledUp: true,
        showScrollToBottomButton: true
      })
    );
  }
};

export const updateHasNewMessage = hasNew => dispatch => {
  dispatch(
    updateWidgetState({
      hasNewMessage: hasNew
    })
  );
};

export const confirmDeleteActivity = activityId => dispatch => {
  dispatch(
    updateWidgetState({
      deletingActivityId: activityId,
      showAlertModal: true
    })
  );
};

export const hideDeleteModal = () => dispatch => {
  dispatch(
    updateWidgetState({
      deletingActivityId: null,
      showAlertModal: false
    })
  );
};

// export const deleteActivityAndDismiss = (
//   conversation,
//   activity,
//   webex
// ) => dispatch => {
//   dispatch(deleteActivity(conversation, activity, webex)).then(() => {
//     dispatch(hideDeleteModal());
//   });
// };

// Export the customized selectors for this adapter using `getSelectors`
export const selectWidgetSpace = state => state.widgetSpace;

export default widgetMessageSlice.reducer;
