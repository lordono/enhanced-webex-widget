import React, { useContext } from "react";
import clsx from "clsx";
import { useSelector, useDispatch } from "react-redux";
import { formatDistance, parseISO, isBefore } from "date-fns";

import { FilesContext } from "../../../features/files/filesStore";
import { StoreContext } from "../../../features/webex/webexStore";
import { selectCurrentUser } from "../../../features/users/usersSlice";
import { chooseSpace } from "../../../features/widgetMessage/widgetMessageSlice";

const formatRoomDate = stringDate => {
  return formatDistance(parseISO(stringDate), new Date(), { addSuffix: true });
};

const findTitle = (selfId, users, conversation) => {
  if (conversation.displayName) return conversation.displayName;
  else {
    for (let person of conversation.participants) {
      if (person !== selfId) return users[person].displayName;
    }
    return "Unknown";
  }
};

const getShortDesc = (activity, users) => {
  const name = users[activity.actor].displayName;
  if (
    activity.type === "create" &&
    activity.object.objectType === "conversation"
  ) {
    return `${name} started the space`;
  }
  if (activity.type === "post") {
    return `${name}: ${activity.object.displayName}`;
  } else if (activity.type === "share" || activity.type === "create") {
    return `${name} shared a file`;
  } else if (activity.type === "add") {
    if (activity.object.objectType === "person") {
      return `${activity.object.displayName} added`;
    }
  } else if (activity.type === "leave") {
    if (activity.object.objectType === "person") {
      if (activity.actor !== activity.object.id) {
        return `${activity.object.displayName} removed`;
      } else {
        return `${activity.object.displayName} left`;
      }
    }
  }
  return "";
};

export const RecentRow = props => {
  const { id } = props;
  const dispatch = useDispatch();
  const [webex] = useContext(StoreContext);
  const filesStore = useContext(FilesContext);
  const users = useSelector(state => state.users.entities);
  const currentUser = useSelector(selectCurrentUser);
  const selectedSpace = useSelector(state => state.widgetMessage.selectedSpace);
  const space = useSelector(state => state.spaces.entities[id]);
  const lastActivity = useSelector(
    state => state.activities.entities[space.latestActivity]
  );
  if (space.isFetching) {
    return null;
  } else {
    const selected = selectedSpace === id;
    const isUnread = isBefore(
      parseISO(space.lastSeenActivityDate),
      parseISO(space.lastReadableActivityDate)
    );

    const rowClass = clsx(
      "App-recent-row",
      selected && "selected",
      isUnread && "unread"
    );

    const title = findTitle(currentUser.id, users, space).trim();

    const onClickRow = () =>
      dispatch(chooseSpace(webex, filesStore, id, space.url));

    return (
      <div className={rowClass} onClick={onClickRow}>
        <div className="avatar">{title[0]}</div>
        <div className="chat-row-info">
          <div className="chat-row-main">
            <span className="chat-row-title">{title}</span>
            <span className="chat-row-date">
              {formatRoomDate(space.lastReadableActivityDate)}
            </span>
          </div>
          <div className="chat-row-description">
            {lastActivity ? getShortDesc(lastActivity, users) : null}
          </div>
        </div>
      </div>
    );
  }
};
