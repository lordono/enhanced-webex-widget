import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";

const errorsAdapter = createEntityAdapter();

const initialState = errorsAdapter.getInitialState({
  hasError: false
});

export const errorsSlice = createSlice({
  name: "errors",
  initialState,
  reducers: {
    add: (state, action) => {
      state.hasError = true;
      errorsAdapter.addOne(state, action.payload);
    },
    remove: (state, action) => {
      const { errorId } = action.payload;
      errorsAdapter.removeOne(state, errorId);

      if (state.ids.length === 0) state.hasError = false;
    },
    reset: (state, action) => {
      state = initialState;
    }
  }
});

export const { add, remove, reset } = errorsSlice.actions;

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllErrors,
  selectById: selectErrorById,
  selectIds: selectErrorIds
} = errorsAdapter.getSelectors(state => state.errors);

export default errorsSlice.reducer;
