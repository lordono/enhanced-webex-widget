export const initializeComposeSlice = space => {
  return {
    id: space.id,
    content: "",
    displayName: "",
    objectType: "comment"
  };
};

export const initializeComposeStore = space => {
  return {
    id: space.id,
    files: [],
    shareActivity: null
  };
};
