import { createSlice } from "@reduxjs/toolkit";

export const featuresSlice = createSlice({
  name: "features",
  initialState: {
    items: {}
  },
  reducers: {
    storeFeature: (state, action) => {
      state.items = { ...state.items, ...action.payload };
    }
  }
});

export const { storeFeature } = featuresSlice.actions;

export const getFeature = (keyType, key, webex) => dispatch => {
  return webex.internal.feature.getFeature(keyType, key).then(value => {
    const result = {};

    result[key] = value;
    dispatch(storeFeature(result));
  });
};

// Export the customized selectors for this adapter using `getSelectors`
export const selectAllFeatures = state => state.features.items;

export default featuresSlice.reducer;
