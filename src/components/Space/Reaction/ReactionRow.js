import React from "react";
import { ReactionButton } from "./ReactionButton";

const celebrate = "🎉";
const thumbsup = "👍";
const heart = "❤️";
const smiley = "🙂";
const haha = "😆";
const confused = "😮";
const sad = "😥";

export const ReactionRow = ({ reactions }) => {
  if (reactions && reactions.count) {
    return (
      <div className="msg-row-reactions">
        {reactions.celebrate.length > 0 && (
          <ReactionButton
            count={reactions.celebrate.length}
            emoji={celebrate}
          />
        )}
        {reactions.thumbsup.length > 0 && (
          <ReactionButton count={reactions.thumbsup.length} emoji={thumbsup} />
        )}
        {reactions.heart.length > 0 && (
          <ReactionButton count={reactions.heart.length} emoji={heart} />
        )}
        {reactions.smiley.length > 0 && (
          <ReactionButton count={reactions.smiley.length} emoji={smiley} />
        )}
        {reactions.haha.length > 0 && (
          <ReactionButton count={reactions.haha.length} emoji={haha} />
        )}
        {reactions.confused.length > 0 && (
          <ReactionButton count={reactions.confused.length} emoji={confused} />
        )}
        {reactions.sad.length > 0 && (
          <ReactionButton count={reactions.sad.length} emoji={sad} />
        )}
      </div>
    );
  } else return null;
};
