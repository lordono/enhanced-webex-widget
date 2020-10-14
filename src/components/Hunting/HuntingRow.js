import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatDistance, parseISO } from "date-fns";

import {
  selectUsersByIds,
  selectCurrentUser
} from "../../features/users/usersSlice";
import {
  addHuntingLine,
  removeHuntingLine
} from "../../features/hunting/huntingSlice";

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

export const HuntingRow = props => {
  const { id } = props;
  const dispatch = useDispatch();
  const users = useSelector(state => state.users.entities);
  const currentUser = useSelector(selectCurrentUser);
  const space = useSelector(state => state.spaces.entities[id]);
  const huntingSpaces = useSelector(state => state.hunting.spaces);
  const lastActivity = useSelector(
    state => state.activities.entities[space.latestActivity]
  );
  const participants = useSelector(state =>
    selectUsersByIds(state, space.participants)
  );

  if (space.isFetching) {
    return null;
  } else {
    const title = findTitle(currentUser.id, users, space).trim();
    const isHunting = huntingSpaces.includes(space.id);
    const radioName = isHunting ? "radio-button-on" : "radio-button-off";

    return (
      <div
        className="App-recent-row"
        onClick={() => {
          if (isHunting) {
            dispatch(removeHuntingLine(space.id));
          } else {
            dispatch(addHuntingLine(space.id));
          }
        }}
      >
        <div className="radio-container">
          <ion-icon name={radioName} />
        </div>
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
            <div className="chat-row-pax">
              {participants.length}
              <ion-icon name="person" class="chat-row-pax-icon" />
            </div>
          </div>
        </div>
      </div>
    );
  }
};
