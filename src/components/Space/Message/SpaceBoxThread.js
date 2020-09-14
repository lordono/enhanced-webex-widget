import React from "react";
import { useSelector } from "react-redux";

import { selectReactionById } from "../../../features/reactions/reactionsSlice";
import { formatActivity } from "../../../features/activities/helpers";
import { formatMsgTime } from "../../formatDates";

import { ReactionRow } from "./Reaction/ReactionRow";
import { SpaceContent } from "./SpaceContent";

const Thread = ({ id, currentUser }) => {
  const activity = useSelector(s => s.activities.entities[id]);
  const reactions = useSelector(s => selectReactionById(s, activity.id));
  const author = useSelector(s => s.users.entities[activity.actor]);

  let formattedActivity = activity;
  if (activity.type === "post") {
    formattedActivity = Object.assign({}, activity, {
      object: formatActivity(activity.object)
    });
  }

  const authorName =
    currentUser === author.id ? "You" : author.displayName.trim();
  const authorAvatar = author => {
    const name = author.displayName.trim();
    const nameList = name.split(/\s/).map(i => i[0]);
    return nameList.slice(0, 2).join("");
  };

  return (
    <div className="msg-row" key={formattedActivity.id}>
      <div className="avatar">{authorAvatar(author)}</div>
      <div className="msg-row-info">
        <div className="msg-row-main">
          <div className="msg-row-name">{authorName}</div>
          <div className="msg-row-date">
            {formatMsgTime(formattedActivity.published)}
          </div>
        </div>
        <div className="msg-row-content">
          <SpaceContent activity={formattedActivity} />
          <ReactionRow reactions={reactions} />
        </div>
      </div>
    </div>
  );
};

export const SpaceBoxThread = React.memo(Thread);
