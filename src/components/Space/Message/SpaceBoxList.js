import React, { useContext, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { debounce } from "lodash";

import { formatDate } from "../../formatDates";
import { StoreContext } from "../../../features/webex/webexStore";
import { FilesContext } from "../../../features/files/filesStore";
import {
  loadPreviousMessages,
  acknowledgeActivityOnServer,
  updateWidgetInSpace as updateWidget
} from "../../../features/spaces/spacesSlice";

import { SpaceBoxRow } from "./SpaceBoxRow";
import { Separator } from "../../Separator/Separator";
import { getActivityList } from "../../../features/activities/selectors";
import { SpaceBoxSystemUser } from "./System/SpaceBoxSystemUser";
import { SpaceBoxSystemCreate } from "./System/SpaceBoxSystemCreate";
import { SpaceBoxSystemDelete } from "./System/SpaceBoxSystemDelete";
import { MessageReceipts } from "./Receipts/MessageReceipts";

export const SpaceBoxList = ({ space }) => {
  const { lastAcknowledgedActivityId, widgetMessage } = space;
  const {
    scrollTop,
    scrolledBottom,
    windowHeight,
    loadHistory,
    activitiesLength
  } = widgetMessage;
  const [initial, setInitial] = useState(true);
  const windowRef = useRef(null);
  const filesStore = useContext(FilesContext);
  const [webex] = useContext(StoreContext);
  const dispatch = useDispatch();
  const activities = useSelector(state => getActivityList(state, space.id));
  const firstActivity = activities.length > 0 ? activities[0] : null;
  const lastActivity =
    activities.length > 0 ? activities[activities.length - 1] : null;
  const needAck = lastAcknowledgedActivityId !== lastActivity.id;

  //
  // when you first enter space, scroll down.
  //
  useEffect(() => {
    if (space.id) {
      setInitial(true);
    }
  }, [space.id]);

  useEffect(() => {
    const node = windowRef.current;
    if (activitiesLength > 0 && node && initial) {
      setInitial(false);
      const isScrolledToBottom =
        node.scrollHeight - node.offsetHeight - node.scrollTop < 150;
      dispatch(
        updateWidget(space.id, {
          windowHeight: node.scrollHeight
        })
      );

      // scroll down a little if first activity is not creation of conversation
      if (scrollTop !== 0) {
        node.scrollTo({ top: scrollTop });
      } else if (!firstActivity.creation) {
        node.scrollTo({ top: 100, behavior: "smooth" });
      }

      // acknowledge last activity if conversation is short (non-scrollable screen)
      if (isScrolledToBottom) {
        dispatch(updateWidget(space.id, { scrolledBottom: true }));
        if (needAck) {
          console.log("need to acknowledge here.");
          const activity = { id: lastActivity.id, url: lastActivity.url };
          dispatch(acknowledgeActivityOnServer(webex, space, activity));
        }
      }
    }
  }, [
    dispatch,
    webex,
    scrollTop,
    activitiesLength,
    initial,
    needAck,
    firstActivity.creation,
    space,
    lastActivity.id,
    lastActivity.url
  ]);

  //
  // when scrolledBottom, it should auto-scroll down and acknowledge any new activities
  //
  useEffect(() => {
    if (activitiesLength < activities.length) {
      dispatch(updateWidget(space.id, { activitiesLength: activities.length }));
    }
  }, [dispatch, space.id, activities, activitiesLength]);

  useEffect(() => {
    const node = windowRef.current;
    if (activitiesLength && scrolledBottom) {
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    }
  }, [activitiesLength, scrolledBottom]);

  //
  // handle any other scroll action in the window
  //
  const handleScroll = () => {
    const node = windowRef.current;
    const { scrollTop, scrollHeight, offsetHeight } = node;

    const isScrolledToTop = scrollTop < 100;
    const isScrolledToBottom = scrollHeight - offsetHeight - scrollTop < 150;

    // load more activities if required
    if (isScrolledToTop) {
      if (firstActivity && !firstActivity.creation && !loadHistory) {
        const { published } = firstActivity;
        dispatch(updateWidget(space.id, { scrollTop, loadHistory: true }));
        dispatch(
          loadPreviousMessages(space, published, webex, filesStore)
        ).then(() => {
          const node = windowRef.current;
          node.scrollTo({ top: node.scrollHeight - windowHeight });
          dispatch(
            updateWidget(space.id, {
              windowHeight: node.scrollHeight,
              loadHistory: false
            })
          );
        });
      }
    }

    // send acknowledge to server if required
    if (isScrolledToBottom) {
      dispatch(updateWidget(space.id, { scrollTop, scrolledBottom: true }));
      console.log("scrolled to bottom");
      if (needAck) {
        console.log("need to acknowledge here.");
        const activity = { id: lastActivity.id, url: lastActivity.url };
        dispatch(acknowledgeActivityOnServer(webex, space, activity));
      }
    } else {
      dispatch(updateWidget(space.id, { scrollTop, scrolledBottom: false }));
    }
  };

  const deHandleScroll = debounce(handleScroll, 300);

  // render Activity based on type
  const renderActivity = obj => {
    switch (obj.type) {
      case "ITEM_TYPE_ACTIVITY":
        if (obj.name) {
          return <SpaceBoxSystemUser key={obj.id} {...obj} />;
        } else if (obj.creation) {
          return <SpaceBoxSystemCreate key={obj.id} {...obj} />;
        } else if (obj.msgDeleted) {
          return <SpaceBoxSystemDelete key={obj.id} {...obj} />;
        } else {
          return <SpaceBoxRow key={obj.id} {...obj} />;
        }
      case "ITEM_TYPE_DAY_SEPARATOR":
        return <Separator key={obj.key} primaryText={formatDate(obj.toDate)} />;
      case "ITEM_TYPE_NEW_MESSAGE_SEPARATOR":
        return (
          <Separator
            key={obj.key}
            primaryText="New Messages"
            isInformative={true}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="msg-window" onScroll={deHandleScroll} ref={windowRef}>
      {firstActivity && !firstActivity.creation && (
        <div className="load-more">Loading More...</div>
      )}
      {activities.map(activity => renderActivity(activity))}
      <MessageReceipts readReceipts={space.readReceipts} />
    </div>
  );
};
