import React, { useState, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { StoreContext } from "../../../features/webex/webexStore";
import { FilesContext } from "../../../features/files/filesStore";
import { useDebouncedSearch } from "../../Recent/useDebouncedSearch";

import {
  localSearch,
  cleanRemoteResults,
  dedupUserSpaces,
  removeSelf
} from "../helpers";

import "./SpaceForm.scss";
import { createSpace } from "../../../features/widgetMessage/widgetMessageSlice";

export const SpaceForm = () => {
  const dispatch = useDispatch();

  const filesStore = useContext(FilesContext);
  const [webex] = useContext(StoreContext);
  const userArray = useSelector(state => Object.values(state.users.entities));
  const currentUser = useSelector(
    state => state.users.entities[state.users.currentUserId]
  );

  const [name, setName] = useState("");
  const [participants, setParticipants] = useState([
    {
      id: currentUser.id,
      displayName: currentUser.displayName,
      emailAddress: currentUser.email,
      orgId: currentUser.orgId
    }
  ]);

  const useUserSearch = () =>
    useDebouncedSearch(text => {
      return webex.internal.search.people({ query: text });
    });

  const { inputText, setInputText, searchResults } = useUserSearch();

  const remoteResults = searchResults.result || [];

  const searchList = removeSelf(
    dedupUserSpaces([
      ...localSearch(userArray, inputText),
      ...cleanRemoteResults(remoteResults)
    ]),
    currentUser.id
  );

  const onAddParticipant = user => {
    setParticipants(e => {
      const newList = e.slice();
      newList.push(user);
      return newList;
    });
  };

  const onRemoveParticipant = id => {
    setParticipants(e => {
      const newList = e.slice();
      const index = e.findIndex(i => i.id === id);
      newList.splice(index, 1);
      return newList;
    });
  };

  const onAddSpace = () => {
    if (name && participants.length > 0) {
      dispatch(createSpace(webex, filesStore, participants, name));
    }
  };

  return (
    <>
      <div className="msg-header">
        <div className="msg-header-main">
          <div className="msg-header-toolkit"></div>
          <div className="msg-header-title">Create Space</div>
        </div>
      </div>
      <div className="space-form">
        <div className="space-main">
          <div className="space-main-form">
            <div className="space-input-group">
              <div className="space-input-label">Space Name</div>
              <input
                type="text"
                className="space-input"
                placeholder="Space Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="space-input-group">
              <div className="space-input-label">Participants</div>
              <div className="space-input-list">
                {participants.map(i => (
                  <div key={i.id} className="space-input-li">
                    <div className="space-input-main">
                      <div className="space-input-title">{i.displayName}</div>
                      <div className="space-input-desc">{i.emailAddress}</div>
                    </div>
                    <div
                      className="space-input-button"
                      onClick={() => onRemoveParticipant(i.id)}
                    >
                      Remove
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div
            className="space-input-button"
            onClick={onAddSpace}
            disabled={!name || participants.length === 0}
          >
            Add Space
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
    </>
  );
};
