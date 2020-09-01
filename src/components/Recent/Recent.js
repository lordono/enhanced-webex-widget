import React, { useContext, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { updateStatus as updateWidgetStatus } from "../../features/widgetRecents/widgetRecentsSlice";
import { StoreContext } from "../../features/webex/webexStore";
import { FilesContext } from "../../features/files/filesStore";

import { useDebouncedSearch } from "./useDebouncedSearch";
import {
  localSearch,
  cleanRemoteResults,
  dedupUserSpaces,
  removeSelf
} from "./helpers";
import { RecentRow } from "./Row/Row";
import { RecentSearchList } from "./Search";
import { RecentButton } from "./RecentButton";
import "./Recent.scss";

export const Recent = () => {
  const [webex] = useContext(StoreContext);
  const filesStore = useContext(FilesContext);
  // mode determine if it is search/spaces
  const mode = useSelector(state => state.widgetRecents.status.mode);
  const dispatch = useDispatch();

  const spaces = useSelector(state => state.spaces.ids);
  const spaceArray = useSelector(state => Object.values(state.spaces.entities));
  const userArray = useSelector(state => Object.values(state.users.entities));
  const currentUserId = useSelector(state => state.users.currentUserId);

  const useUserSearch = () =>
    useDebouncedSearch(text => {
      return webex.internal.search.people({ query: text });
    });

  const { inputText, setInputText, searchResults } = useUserSearch();

  const remoteResults = searchResults.result || [];

  const finalResult = removeSelf(
    dedupUserSpaces([
      ...localSearch(spaceArray, userArray, inputText),
      ...cleanRemoteResults(remoteResults)
    ]),
    currentUserId
  );

  useEffect(() => {
    console.log(filesStore.files);
  }, [filesStore.files]);

  return (
    <div className="App-recent">
      <div className="recent-header">
        <input
          type="text"
          className="recent-search"
          placeholder="Search"
          value={inputText}
          onFocus={() => dispatch(updateWidgetStatus({ mode: "search" }))}
          onChange={e => setInputText(e.target.value)}
        />
        <RecentButton setInputText={setInputText} />
      </div>
      {mode === "spaces" && (
        <>
          <div className="recent-sort">Sort by: </div>
          <div className="recent-content">
            {spaces.map(i => {
              return <RecentRow key={i} id={i} />;
            })}
          </div>
        </>
      )}
      {mode === "search" && (
        <div className="recent-content">
          <RecentSearchList
            loading={searchResults.loading}
            searchList={finalResult}
          />
        </div>
      )}
    </div>
  );
};
