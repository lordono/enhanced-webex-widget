import { createSlice } from "@reduxjs/toolkit";

// api url
const apiUrl = process.env.REACT_APP_SERVER_URL;

const initialState = {
  spaces: [],
  fetched: false
};

export const huntingSlice = createSlice({
  name: "hunting",
  initialState,
  reducers: {
    updateStatus: (state, action) => {
      state.fetched = action.payload;
    },
    add: (state, action) => {
      const newArray = [...new Set([...state.spaces, action.payload])];
      state.spaces = newArray;
    },
    remove: (state, action) => {
      if (action.payload) {
        const index = state.spaces.findIndex(i => i === action.payload);
        if (index >= 0) {
          const newArray = state.spaces.slice();
          newArray.splice(index, 1);
          state.spaces = newArray;
        }
      }
    },
    addMany: (state, action) => {
      const newArray = [...new Set([...state.spaces, ...action.payload])];
      state.spaces = newArray;
    },
    reset: (state, action) => {
      state = initialState;
    }
  }
});

export const {
  updateStatus,
  add,
  remove,
  addMany,
  reset
} = huntingSlice.actions;

export const getHuntingLines = () => (dispatch, getState) => {
  const fetched = getState().hunting.fetched;
  if (!fetched) {
    dispatch(updateStatus(true));
    fetch(`${apiUrl}/hunting`)
      .then(response => response.json())
      .then(data => dispatch(addMany(data)));
  }
};

export const addHuntingLine = id => dispatch => {
  fetch(`${apiUrl}/hunting`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      spaces: [id]
    })
  })
    .then(response => response.json())
    .then(data => dispatch(addMany(data)));
};

export const removeHuntingLine = id => dispatch => {
  fetch(`${apiUrl}/hunting`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      spaces: [id]
    })
  })
    .then(response => response.json())
    .then(() => dispatch(remove(id)));
};

export default huntingSlice.reducer;
