import React from "react";
import clsx from "clsx";
import { parseISO, isAfter } from "date-fns";
import { useSelector } from "react-redux";
import { selectReactionById } from "../../../features/reactions/reactionsSlice";
import { selectThreadById } from "../../../features/threads/threadsSlice";
import { formatActivity } from "../../../features/activities/helpers";
import { formatMsgTime } from "../../formatDates";

import { ReactionRow } from "./Reaction/ReactionRow";
import { SpaceBoxThread } from "./SpaceBoxThread";
import { SpaceContent } from "./SpaceContent";

const Row = ({ id, isAdditional, isSelf, currentUser }) => {
  const activity = useSelector(s => s.activities.entities[id]);
  const reactions = useSelector(s => selectReactionById(s, activity.id));
  const author = useSelector(s => s.users.entities[activity.actor]);

  // get threads for each msg
  const threadIds = useSelector(s => selectThreadById(s, activity.id)) || {
    id: null,
    threads: []
  };
  const threads = threadIds.threads.slice();
  threads.sort((a, b) => {
    return isAfter(parseISO(b.published), parseISO(a.published)) ? -1 : 1;
  });

  // normalize activity
  let formattedActivity = activity;
  if (activity.type === "post") {
    formattedActivity = Object.assign({}, activity, {
      object: formatActivity(activity.object)
    });
  }

  const authorName = isSelf ? "You" : author.displayName.trim();
  const authorAvatar = author => {
    const name = author.displayName.trim();
    const nameList = name.split(/\s/).map(i => i[0]);
    return nameList.slice(0, 2).join("");
  };
  const rowClass = clsx("msg-row", isAdditional && "same-user");

  return (
    <>
      <div className={rowClass} key={formattedActivity.id}>
        {!isAdditional && <div className="avatar">{authorAvatar(author)}</div>}
        <div className="msg-row-info">
          {!isAdditional && (
            <div className="msg-row-main">
              <div className="msg-row-name">{authorName}</div>
              <div className="msg-row-date">
                {formatMsgTime(formattedActivity.published)}
              </div>
            </div>
          )}
          <div className="msg-row-content">
            <SpaceContent activity={formattedActivity} />
            <ReactionRow reactions={reactions} />
          </div>
        </div>
      </div>
      {threads.length > 0 && (
        <div className="msg-thread">
          {threads.map(i => (
            <SpaceBoxThread key={i.id} id={i.id} currentUser={currentUser} />
          ))}
        </div>
      )}
    </>
  );
};

export const SpaceBoxRow = React.memo(Row);
