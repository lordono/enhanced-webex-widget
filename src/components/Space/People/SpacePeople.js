import React, { useContext, useState } from "react";
import { useSelector } from "react-redux";
import isEmail from "validator/es/lib/isEmail";

import { selectUsersByIds } from "../../../features/users/usersSlice";
import { StoreContext } from "../../../features/webex/webexStore";
import { useDebouncedSearch } from "../../useDebouncedSearch";

import {
  localSearch,
  cleanRemoteResults,
  dedupUserSpaces,
  removeSelf,
  removeExisting
} from "../helpers";

export const SpacePeople = ({ space }) => {
  const [addingStatus, setAddingStatus] = useState(false);
  const [removingStatus, setRemovingStatus] = useState(false);

  const [webex] = useContext(StoreContext);
  const userArray = useSelector(state => Object.values(state.users.entities));
  const currentUser = useSelector(
    state => state.users.entities[state.users.currentUserId]
  );

  const participants = useSelector(state =>
    selectUsersByIds(state, space.participants)
  );

  const useUserSearch = () =>
    useDebouncedSearch(text => {
      return webex.internal.search.people({ query: text });
    });

  const { inputText, setInputText, searchResults } = useUserSearch();

  const remoteResults = searchResults.result || [];

  const searchList = removeExisting(
    removeSelf(
      dedupUserSpaces([
        ...localSearch(userArray, inputText),
        ...cleanRemoteResults(remoteResults)
      ]),
      currentUser.id
    ),
    space.participants
  );

  const onAddParticipant = user => {
    let userObject = user;
    setAddingStatus(true);

    if (typeof participant === "string") {
      if (isEmail(user)) {
        userObject = {
          id: user,
          displayName: user,
          name: user,
          emailAddress: user
        };
      }
    }
    return webex.internal.conversation
      .add(space, userObject)
      .then(() => setAddingStatus(false))
      .catch(() => {
        setAddingStatus(false);
        alert("Unable to add participant");
      });
  };

  const onRemoveParticipant = user => {
    setRemovingStatus(true);
    return webex.internal.conversation
      .leave(space, user.id)
      .then(() => setRemovingStatus(false))
      .catch(() => {
        setRemovingStatus(false);
        alert("Unable to remove participant");
      });
  };

  return (
    <div className="space-form">
      <div className="space-main">
        <div className="space-main-form">
          <div className="space-input-group">
            <div className="space-input-label">Space Name</div>
            <input
              type="text"
              className="space-input"
              placeholder="Space Name"
              value={space.displayName}
              readOnly
            />
          </div>
          <div className="space-input-group">
            <div className="space-input-label">Participants</div>
            <div className="space-input-list">
              {participants.map(i => (
                <div key={i.id} className="space-input-li">
                  <div className="space-input-main">
                    <div className="space-input-title">{i.displayName}</div>
                    <div className="space-input-desc">{i.email}</div>
                  </div>
                  {i.id !== currentUser.id && (
                    <div
                      className="space-input-button"
                      onClick={() => onRemoveParticipant(i)}
                    >
                      Remove
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="space-search">
        <div className="space-input-group">
          <div className="space-input-label">Add Participants</div>
          <input
            type="text"
            className="space-input"
            placeholder="Search..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
        </div>
        <div className="space-input-list">
          {isEmail(inputText) && (
            <div className="space-input-li">
              <div className="space-input-main">
                <div className="space-input-title">{inputText}</div>
              </div>
              <div
                className="space-input-button"
                onClick={() => onAddParticipant(inputText)}
              >
                Add
              </div>
            </div>
          )}
          {searchList.map(i => (
            <div key={i.id} className="space-input-li">
              <div className="space-input-main">
                <div className="space-input-title">{i.displayName}</div>
                <div className="space-input-desc">{i.emailAddress}</div>
              </div>
              <div
                className="space-input-button"
                onClick={() => onAddParticipant(i)}
              >
                Add
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
