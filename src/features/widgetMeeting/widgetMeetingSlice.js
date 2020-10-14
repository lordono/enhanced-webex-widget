import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  current: {
    created: false,
    creating: false,
    spaceId: null,
    spaceUrl: null
  },
  joiningMeeting: false,
  inMeeting: false,
  isMuted: false,
  isOnVideo: true,
  isEventBinded: false
};

export const widgetMeetingSlice = createSlice({
  name: "widgetMeeting",
  initialState: {
    ...initialState,
    spaceWithMeeting: []
  },
  reducers: {
    storeMeeting: (state, action) => {
      const spaceId = action.payload;
      const updatedList = [...state.spaceWithMeeting, spaceId].filter(
        (item, index, self) => index === self.findIndex(t => t === item)
      );
      state.spaceWithMeeting = updatedList;
    },
    updateMeeting: (state, action) => {
      const { spaceId, spaceUrl, created = false } = action.payload;
      state.current.spaceId = spaceId;
      state.current.spaceUrl = spaceUrl;
      state.current.created = created;
    },
    setAttribute: (state, action) => {
      const { attr, value } = action.payload;
      state[attr] = value;
    },
    resetWidgetMeeting: state => {
      Object.keys(initialState).forEach(i => {
        state[i] = initialState[i];
      });
    }
  }
});

export const {
  storeMeeting,
  updateMeeting,
  setAttribute,
  resetWidgetMeeting
} = widgetMeetingSlice.actions;

export const updateCurrentMeeting = props => (dispatch, getState) => {
  const widgetMeeting = getState().widgetMeeting;
  if (widgetMeeting.inMeeting) {
    return Promise.resolve({ error: "Existing meeting in progress." });
  } else {
    dispatch(updateMeeting(props));
    return Promise.resolve({ error: null });
  }
};

export const removeCurrentMeeting = url => (dispatch, getState) => {
  const widgetMeeting = getState().widgetMeeting;
  if (
    widgetMeeting.current.spaceUrl &&
    widgetMeeting.current.spaceUrl === url
  ) {
    dispatch(updateMeeting({ spaceId: null, spaceUrl: null }));
    return Promise.resolve({ error: null });
  }
};

// Export the customized selectors for this adapter using `getSelectors`
export const selectWidgetMeeting = state => state.widgetMeeting;

export default widgetMeetingSlice.reducer;
