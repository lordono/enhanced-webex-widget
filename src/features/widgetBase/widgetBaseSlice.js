import { createSlice } from "@reduxjs/toolkit";

/**
 * mode: can be message or video (change the layout)
 */
export const widgetBaseSlice = createSlice({
  name: "widgetBase",
  initialState: {
    mode: "message"
  },
  reducers: {
    changeMode: (state, action) => {
      state.mode = action.payload;
    }
  }
});

export const { changeMode } = widgetBaseSlice.actions;

// Export the customized selectors for this adapter using `getSelectors`
export const selectWidgetBase = state => state.widgetBase;

export default widgetBaseSlice.reducer;
