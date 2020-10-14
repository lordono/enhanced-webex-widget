import { createSlice } from "@reduxjs/toolkit";

export const widgetRecentsSlice = createSlice({
  name: "widgetRecents",
  initialState: {
    incomingCall: null,
    keyword: null,
    spaceType: null,
    status: {
      mode: "spaces",
      isFetchingInitialSpaces: false,
      hasFetchedInitialSpaces: false,
      isFetchingAllSpaces: false,
      hasFetchedAllSpaces: false,
      isFetchingRecentSpaces: false,
      hasFetchedRecentSpaces: false,
      isFetchingTeams: false,
      hasFetchedTeams: false,
      isFetchingAvatars: false,
      hasFetchedAvatars: false,
      isListeningForNewActivity: false,
      hasFetchedGroupMessageNotificationFeature: false,
      hasFetchedMentionNotificationFeature: false,
      scrollTopValue: 0,
      isScrolledToTop: true
    }
  },
  reducers: {
    updateStatus: (state, action) => {
      state.status = { ...state.status, ...action.payload };
    },
    updateStatusKeywordFilter: (state, action) => {
      state.keyword = action.payload ? action.payload.trim() : "";
    }
  }
});

export const {
  updateStatus,
  updateStatusKeywordFilter
} = widgetRecentsSlice.actions;

// Export the customized selectors for this adapter using `getSelectors`
export const selectWidgetRecents = state => state.widgetRecents;

export default widgetRecentsSlice.reducer;
