import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

export const indicatorsSlice = createSlice({
  name: "indicators",
  initialState,
  reducers: {
    addIndicator: (state, action) => {
      state.push(action.payload);
    },
    removeIndicator: (state, action) => {
      const findIndex = state.findIndex(i => i === action.payload);
      state.splice(findIndex, 1);
    },
    resetIndicators: state => {
      state = initialState;
    }
  }
});

export const {
  addIndicator,
  removeIndicator,
  resetIndicators
} = indicatorsSlice.actions;

// Export the customized selectors for this adapter using `getSelectors`
export const selectIndicators = state => state.indicators;

export default indicatorsSlice.reducer;
