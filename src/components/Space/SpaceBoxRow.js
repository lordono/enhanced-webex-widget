import React, { useContext } from "react";
import clsx from "clsx";
// import DOMPurify from "dompurify";
import ReactHtmlParser from "react-html-parser";
import { parseISO, isAfter } from "date-fns";
import { useSelector } from "react-redux";
import { selectReactionById } from "../../features/reactions/reactionsSlice";
import { selectThreadById } from "../../features/threads/threadsSlice";
import { formatActivity } from "../../features/activities/helpers";
import { ReactionRow } from "./Reaction/ReactionRow";
import { SpaceBoxThread } from "./SpaceBoxThread";
import { formatMsgTime } from "../formatDates";
import { FilesContext } from "../../features/files/filesStore";
import LoadingImg from "../../img/loading.svg";

const Row = ({ id, isAdditional, isSelf, currentUser }) => {
  const { files } = useContext(FilesContext);
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

  // render content
  const renderContent = activity => {
    let fileContent = null;
    let textContent = null;
    if (activity.type === "share") {
      if (
        activity.object.objectType === "content" &&
        activity.object.contentCategory === "images"
      ) {
        fileContent = (
          <div>
            {activity.object.files.map(item => {
              let content = LoadingImg;
              if (
                Object.keys(files).includes(item.url) &&
                !files[item.url].isFetching
              ) {
                content = URL.createObjectURL(files[item.url].blob);
              }
              return <img src={content} key={item.url} alt={item.url} />;
            })}
          </div>
        );
      } else {
        fileContent = "--File-Upload--";
      }
    }
    if (activity.object.content) {
      textContent = ReactHtmlParser(activity.object.content);
    }
    return (
      <>
        {fileContent}
        {textContent}
      </>
    );
  };

  const authorName = isSelf ? "You" : author.displayName.trim();
  const rowClass = clsx("msg-row", isAdditional && "same-user");

  return (
    <>
      <div className={rowClass} key={formattedActivity.id}>
        {!isAdditional && <div className="avatar">{authorName[0]}</div>}
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
            {renderContent(formattedActivity)}
            {/* {formattedActivity.object.content
              ? ReactHtmlParser(formattedActivity.object.content)
              : "--File-Upload--"} */}
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
