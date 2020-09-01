import React, { useState, useCallback } from "react";
import { useSelector } from "react-redux";

import { Loading } from "../Loading/Loading";
import { SpaceBoxList } from "./SpaceBoxList";

import LoadingImg from "../../img/loading.svg";

export const SpaceBox = ({ id }) => {
  const space = useSelector(state => state.spaces.entities[id]);
  const [boxRef, setBoxRef] = useState(null);
  const seeBox = useCallback(node => {
    setBoxRef(node);
    if (node !== null) node.focus();
  }, []);

  const handleKeyPress = event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      console.log(boxRef.current.innerHTML);
    }
  };

  return (
    <>
      <div className="msg-header">
        <div className="msg-header-main">
          <div className="msg-header-toolkit"></div>
          <div className="msg-header-title">{space.displayName}</div>
          <div className="msg-header-meet">
            <ion-icon name="videocam-sharp"></ion-icon>
          </div>
        </div>
        <div className="msg-header-tabs">
          <div className="msg-header-tab selected">Messages</div>
          <div className="msg-header-tab">
            People ({space.participants.length})
          </div>
          <div className="msg-header-tab">Content</div>
          <div className="msg-header-tab">Schedule</div>
        </div>
      </div>
      <div className="msg-window">
        {space.hasFetchedActivities && <SpaceBoxList id={id} />}
        {!space.hasFetchedActivities && (
          <Loading img={LoadingImg} text="Loading conversations..." />
        )}
      </div>
      <div className="msg-reply-window">
        <div className="msg-reply-toolkit"></div>
        <div className="msg-reply-main">
          <div
            className="msg-reply-box"
            contentEditable={true}
            datatext={`Write a message to ${space.displayName}`}
            onKeyPress={e => handleKeyPress(e)}
            ref={seeBox}
          ></div>
          <button className="msg-reply-btn">
            <ion-icon name="play-circle-outline"></ion-icon>
          </button>
        </div>
      </div>
    </>
  );
};
