export const constructReaction = activity => {
  const reactions = {};
  let count = 0;
  if (activity.object.reactions) {
    activity.object.reactions.forEach(reaction => {
      reactions[reaction.displayName] = reaction.users.map(i => i.id);
      count += reaction.users.length;
    });
  }

  return {
    id: activity.parent.id,
    published: activity.published,
    count,
    celebrate: reactions.celebrate || [],
    thumbsup: reactions.thumbsup || [],
    heart: reactions.heart || [],
    smiley: reactions.smiley || [],
    haha: reactions.haha || [],
    confused: reactions.confused || [],
    sad: reactions.sad || []
  };
};
