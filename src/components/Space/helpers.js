export const localSearch = (userArray, text) => {
  if (text) {
    const lowerText = text.toLowerCase();
    const otherUserResults = [];

    const userResults = userArray
      .filter(
        i =>
          !otherUserResults.includes(i.id) &&
          (i.email.includes(lowerText) || i.displayName.includes(lowerText))
      )
      .map(i => ({
        id: i.id,
        displayName: i.displayName,
        emailAddress: i.email,
        orgId: i.orgId
      }));
    return userResults;
  } else {
    return [];
  }
};

export const cleanRemoteResults = results => {
  return results.map(i => ({
    id: i.id,
    displayName: i.name,
    emailAddress: i.email,
    orgId: i.orgId
  }));
};

export const dedupUserSpaces = array => {
  return array.filter(
    (item, index, self) => index === self.findIndex(t => t.id === item.id)
  );
};

export const removeSelf = (array, selfId) => {
  return array.filter(i => i.id !== selfId);
};

export const removeExisting = (array, ids) => {
  return array.filter(i => !ids.includes(i.id));
};
