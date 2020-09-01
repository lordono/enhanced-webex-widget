import { createSlice } from "@reduxjs/toolkit";
import { getStatusFromInstance } from "./helpers";

export const webexSlice = createSlice({
  name: "webex",
  initialState: {
    error: null,
    status: {
      authenticated: false,
      authenticating: false,
      registered: false,
      registerError: false,
      registering: false,
      unregisterError: false,
      unregistering: false
    }
  },
  reducers: {
    storeWebex: (state, action) => {
      const { status } = action.payload;
      state.status = status;
    },
    updateStatus: (state, action) => {
      const status = action.payload;
      state.status = { ...state.status, ...status };
    },
    registerDeviceFailure: (state, action) => {
      state.error = action.payload;
      state.status.registerError = true;
      state.status.registering = false;
    },
    unregisterDeviceFailure: (state, action) => {
      state.error = action.payload;
      state.status.unregisterError = true;
      state.status.unregistering = false;
    }
  }
});

const {
  storeWebex,
  updateStatus,
  registerDeviceFailure,
  unregisterDeviceFailure
} = webexSlice.actions;

export const updateWebexStatus = status => dispatch => {
  dispatch(updateStatus(status));
};

export const storeWebexInstance = webex => dispatch => {
  dispatch(storeWebex({ status: getStatusFromInstance(webex) }));
};

export const registerDevice = webex => dispatch => {
  dispatch(updateStatus({ registering: true }));

  return webex.internal.device
    .register()
    .then(() =>
      dispatch(updateStatus({ registering: false, registered: true }))
    )
    .catch(error => dispatch(registerDeviceFailure(error)));
};

export const unregisterDevice = webex => dispatch => {
  dispatch(updateStatus({ unregistering: true }));

  return webex.internal.device
    .unregister()
    .then(() =>
      dispatch(updateStatus({ unregistering: false, registered: false }))
    )
    .catch(error => dispatch(unregisterDeviceFailure(error)));
};

// Export the customized selectors for this adapter using `getSelectors`
export const selectWebex = state => state.webex;

export default webexSlice.reducer;
