import React, { useContext } from "react";
import { useDispatch } from "react-redux";
import isEmail from "validator/es/lib/isEmail";

import {
  chooseSpace,
  createSpace
} from "../../features/widgetMessage/widgetMessageSlice";
import { StoreContext } from "../../features/webex/webexStore";
import { FilesContext } from "../../features/files/filesStore";

import { Loading } from "../Loading/Loading";
import LoadingImg from "../../img/loading.svg";

export const RecentSearchList = ({ inputText, loading, searchList }) => {
  const dispatch = useDispatch();
  const [webex] = useContext(StoreContext);
  const filesStore = useContext(FilesContext);

  const isNewEmail = text => {
    return isEmail(text) && !searchList.find(i => i.email === text);
  };

  // general handling if we click on add
  const onClick = option => {
    if (option.spaceCreated) {
      dispatch(chooseSpace(webex, filesStore, option.spaceId, option.spaceUrl));
    } else {
      dispatch(createSpace(webex, filesStore, [option.userId]));
    }
  };

  // for new email user - just go straight to create.
  const onClickNewEmail = email => {
    dispatch(createSpace(webex, filesStore, [email]));
  };

  if (loading) {
    return <Loading img={LoadingImg} text="Searching..." />;
  } else {
    return (
      <div className="recent-search-ul">
        {isNewEmail(inputText) && (
          <div
            className="recent-search-li"
            onClick={() => onClickNewEmail(inputText)}
          >
            <div className="recent-search-main">
              <div className="recent-search-title">{inputText}</div>
            </div>
            <div className="recent-search-type">User</div>
          </div>
        )}
        {searchList.map(i => {
          if (i.type === "user") {
            return (
              <div
                key={i.userId}
                className="recent-search-li"
                onClick={() => onClick(i)}
              >
                <div className="recent-search-main">
                  <div className="recent-search-title">{i.displayName}</div>
                  <div className="recent-search-desc">{i.email}</div>
                </div>
                <div className="recent-search-type">User</div>
              </div>
            );
          } else {
            return (
              <div
                key={i.spaceId}
                className="recent-search-li"
                onClick={() => onClick(i)}
              >
                <div className="recent-search-main">
                  <div className="recent-search-title">{i.displayName}</div>
                  <div className="recent-search-desc">
                    {i.participants} members
                  </div>
                </div>
                <div className="recent-search-type">Space</div>
              </div>
            );
          }
        })}
      </div>
    );
  }
};
