import React from "react";

export const ReactionButton = ({ count, emoji }) => {
  return (
    <div className="msg-row-react">
      <span role="img" aria-label="celebrate" className="msg-row-emoji">
        {emoji}
      </span>
      <div className="msg-row-emoji-count">{count}</div>
    </div>
  );
};
