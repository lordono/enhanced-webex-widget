import React, { useContext } from "react";
import clsx from "clsx";
import { useSelector, useDispatch } from "react-redux";
import { formatDistance, parseISO, isBefore } from "date-fns";

import { FilesContext } from "../../../features/files/filesStore";
import { MeetingContext } from "../../../features/meeting/meetingStore";
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
  const name = users[activity.actor]
    ? users[activity.actor].displayName
    : "Unknown";
  if (
    activity.type === "create" &&
    activity.object.objectType === "conversation"
  ) {
    // type: start conversation
    return `${name} started the space`;
  }
  if (activity.type === "post") {
    // type: messages
    return `${name}: ${activity.object.displayName}`;
  } else if (activity.type === "share" || activity.type === "create") {
    // type: share files
    return `${name} shared a file`;
  } else if (activity.type === "add") {
    if (activity.object.objectType === "person") {
      // type: adding people
      return `${activity.object.displayName} added`;
    }
  } else if (activity.type === "leave") {
    if (activity.object.objectType === "person") {
      if (activity.actor !== activity.object.id) {
        // type: removing people
        return `${activity.object.displayName} removed`;
      } else {
        // type: person left
        return `${activity.object.displayName} left`;
      }
    }
  } else if (
    activity.object &&
    activity.object.contentCategory === "documents"
  ) {
    // type: share file (applies for update too)
    return `${name} shared a file`;
  } else if (activity.object && activity.object.contentCategory === "images") {
    // type: share image (applies for update too)
    return `${name} shared an image`;
  } else if (
    activity.type === "update" &&
    activity.object.objectType === "locusSessionSummary"
  ) {
    // type: locusSession
    const participants = activity.object.participants.items;
    const isGroupCall = activity.object.isGroupCall;
    const idles = participants.filter(i => i.state === "IDLE");
    const left = participants.filter(i => i.state === "LEFT");
    if (idles >= left) {
      if (isGroupCall) {
        return `${name} started a meeting but no one was available`;
      } else {
        let pronoun = "was";
        if (idles > 0) pronoun = "were";
        return `${idles
          .map(i => i.person.displayName)
          .join(" and ")} ${pronoun} unavailable`;
      }
    } else if (activity.object.duration) {
      return `${name} had a call (${activity.object.duration} sec)`;
    }
  }
  return "";
};

export const RecentRow = props => {
  const { id } = props;
  const dispatch = useDispatch();
  const [webex] = useContext(StoreContext);
  const { meetingStore } = useContext(MeetingContext);
  const filesStore = useContext(FilesContext);
  const users = useSelector(state => state.users.entities);
  const currentUser = useSelector(selectCurrentUser);
  const selectedSpace = useSelector(state => state.widgetMessage.selectedSpace);
  const huntingSpaces = useSelector(state => state.hunting.spaces);
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

    // has-video class
    const curVideo = meetingStore[space.url];
    const noOfPax = curVideo
      ? Object.values(
          curVideo.meeting.members.membersCollection.members
        ).filter(i => i.status === "IN_MEETING").length
      : 0;
    const hasVideoClass = clsx(
      "chat-row-has-video",
      curVideo && "has-video",
      huntingSpaces.includes(space.id) && noOfPax < 2 && "hunting"
    );

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
          <div className="chat-row-sub">
            <div className="chat-row-description">
              {lastActivity ? getShortDesc(lastActivity, users) : null}
            </div>
            <div className={hasVideoClass}>
              {noOfPax > 0 && (
                <span className="chat-row-has-video-text">{noOfPax}</span>
              )}
              <ion-icon name="videocam" class="video" />
              <ion-icon name="megaphone" class="megaphone" />
            </div>
          </div>
        </div>
      </div>
    );
  }
};
