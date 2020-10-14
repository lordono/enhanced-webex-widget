import { createSlice } from "@reduxjs/toolkit";

export const mercurySlice = createSlice({
  name: "mercury",
  initialState: {
    status: {
      connected: false,
      connecting: false,
      hasConnected: false
    }
  },
  reducers: {
    updateStatusConnecting: (state, action) => {
      state.status.connecting = action.payload;
    },
    updateStatusConnected: (state, action) => {
      if (action.payload) state.status.hasConnected = true;
      state.status.connected = action.payload;
    }
  }
});

const { updateStatusConnecting, updateStatusConnected } = mercurySlice.actions;

export const connectToMercury = webex => dispatch => {
  if (webex) {
    const { canAuthorize, internal } = webex;
    const { device, mercury } = internal;

    if (
      canAuthorize &&
      device.registered &&
      !mercury.connected &&
      !mercury.connecting
    ) {
      dispatch(updateStatusConnecting(true));

      return mercury.connect().then(() =>
        webex.listenToAndRun(mercury, "change:connected", () => {
          dispatch(updateStatusConnecting(false));
          dispatch(updateStatusConnected(mercury.connected));
        })
      );
    }
    // Handle if mercury is already connected from previous instance
    if (mercury.connected) {
      return dispatch(updateStatusConnected(mercury.connected));
    }
  }

  return Promise.resolve();
};

// Export the customized selectors for this adapter using `getSelectors`
export const selectMercury = state => state.mercury;
export const selectMercuryStatus = state => state.mercury.status;

export default mercurySlice.reducer;
