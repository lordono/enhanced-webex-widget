import React, { useContext } from "react";
import { useDispatch } from "react-redux";
import {
  chooseSpace,
  createSpace
} from "../../features/widgetMessage/widgetMessageSlice";
import { StoreContext } from "../../features/webex/webexStore";
import { FilesContext } from "../../features/files/filesStore";

import { Loading } from "../Loading/Loading";
import LoadingImg from "../../img/loading.svg";

export const RecentSearchList = ({ loading, searchList }) => {
  const dispatch = useDispatch();
  const [webex] = useContext(StoreContext);
  const filesStore = useContext(FilesContext);

  const onClick = option => {
    if (option.spaceCreated) {
      dispatch(chooseSpace(webex, filesStore, option.spaceId, option.spaceUrl));
    } else {
      dispatch(createSpace(webex, filesStore, [option.userId]));
    }
  };
  if (loading) {
    return <Loading img={LoadingImg} text="Searching..." />;
  } else {
    return (
      <div className="recent-search-ul">
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
