import React, { useContext, useRef, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { debounce } from "lodash";

import { updateStatus as updateWidgetStatus } from "../../features/widgetRecents/widgetRecentsSlice";
import { StoreContext } from "../../features/webex/webexStore";

import { useDebouncedSearch } from "../useDebouncedSearch";
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

  const windowRef = useRef(null);
  const [initial, setInitial] = useState(true);
  // mode determine if it is search/spaces
  const { isScrolledToTop, scrollTopValue, mode } = useSelector(
    state => state.widgetRecents.status
  );
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

  // handle initial
  useEffect(() => {
    const node = windowRef.current;
    if (node && initial) {
      setInitial(false);
      if (scrollTopValue !== 0) {
        node.scrollTo({ top: scrollTopValue });
      }
    }
  }, [initial, scrollTopValue]);

  // handle scroll
  const handleScroll = () => {
    const node = windowRef.current;
    if (node) {
      const { scrollTop } = node;

      // load more activities if required
      if (scrollTop < 100 && isScrolledToTop) {
        node.scrollTo({ top: 0, behavior: "smooth" });
        dispatch(
          updateWidgetStatus({ isScrolledToTop: true, scrollTopValue: 0 })
        );
      } else if (scrollTop < 100 && !isScrolledToTop) {
        dispatch(
          updateWidgetStatus({
            isScrolledToTop: true,
            scrollTopValue: scrollTop
          })
        );
      } else if (scrollTop > 100 && isScrolledToTop) {
        dispatch(
          updateWidgetStatus({
            isScrolledToTop: false,
            scrollTopValue: scrollTop
          })
        );
      } else {
        dispatch(updateWidgetStatus({ scrollTopValue: scrollTop }));
      }
    }
  };

  const deHandleScroll = debounce(handleScroll, 300);

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
          <div
            className="recent-content"
            ref={windowRef}
            onScroll={deHandleScroll}
          >
            {spaces.map(i => {
              return <RecentRow key={i} id={i} />;
            })}
          </div>
        </>
      )}
      {mode === "search" && (
        <div className="recent-content">
          <RecentSearchList
            inputText={inputText}
            loading={searchResults.loading}
            searchList={finalResult}
          />
        </div>
      )}
    </div>
  );
};
