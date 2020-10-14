import { createSlice } from "@reduxjs/toolkit";

// api url
const apiUrl = process.env.REACT_APP_SERVER_URL;

const initialState = {
  filter: {},
  fetched: false
};

export const filterOrgSlice = createSlice({
  name: "filterOrg",
  initialState,
  reducers: {
    updateStatus: (state, action) => {
      state.fetched = action.payload;
    },
    add: (state, action) => {
      state.filter = {
        ...state.filter,
        ...action.payload
      };
    },
    reset: state => {
      state = initialState;
    }
  }
});

export const { add, reset, updateStatus } = filterOrgSlice.actions;

export const getFilter = () => (dispatch, getState) => {
  const fetched = getState().filterOrg.fetched;
  if (!fetched) {
    dispatch(updateStatus(true));
    fetch(`${apiUrl}/filter`)
      .then(response => response.json())
      .then(data => dispatch(add(data)));
  }
};

export default filterOrgSlice.reducer;
