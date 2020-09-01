export const localSearch = (spaceArray, userArray, text) => {
  if (text) {
    const lowerText = text.toLowerCase();
    const otherUserResults = [];
    const spaceResults = spaceArray
      .filter(
        i =>
          i.displayName.replace(/\s/g, "").toLowerCase().includes(lowerText) ||
          (i.emailAddress && i.emailAddress.includes(lowerText))
      )
      .map(i => {
        let type = "space";
        if (i.otherUserId) {
          type = "user";
          otherUserResults.push(i.otherUserId);
        }
        return {
          type,
          userId: i.otherUserId,
          spaceId: i.id,
          spaceUrl: i.url,
          displayName: i.displayName,
          email: i.email,
          participants: i.participants.length,
          spaceCreated: true
        };
      });

    const userResults = userArray
      .filter(
        i =>
          !otherUserResults.includes(i.id) &&
          (i.email.includes(lowerText) || i.displayName.includes(lowerText))
      )
      .map(i => ({
        type: "user",
        userId: i.id,
        spaceId: null,
        spaceUrl: null,
        displayName: i.displayName,
        email: i.email,
        participants: 2,
        spaceCreated: false
      }));
    return spaceResults.concat(userResults);
  } else {
    return [];
  }
};

export const cleanRemoteResults = results => {
  return results.map(i => ({
    type: "user",
    userId: i.id,
    spaceId: null,
    spaceUrl: null,
    displayName: i.name,
    email: i.email,
    participants: 2,
    spaceCreated: false
  }));
};

export const dedupUserSpaces = array => {
  return array.filter(
    (item, index, self) =>
      item.type === "space" ||
      index === self.findIndex(t => t.userId === item.userId)
  );
};

export const removeSelf = (array, selfId) => {
  return array.filter(i => i.userId !== selfId);
};
