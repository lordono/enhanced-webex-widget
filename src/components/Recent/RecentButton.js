import React from "react";
import { useSelector, useDispatch } from "react-redux";

import { updateStatus as updateWidgetStatus } from "../../features/widgetRecents/widgetRecentsSlice";
import { updateWidgetState as updateMessageWidgetStatus } from "../../features/widgetMessage/widgetMessageSlice";

export const RecentButton = ({ setInputText }) => {
  const dispatch = useDispatch();

  const mode = useSelector(state => state.widgetRecents.status.mode);
  const msgMode = useSelector(state => state.widgetMessage.mode);

  if (msgMode === "form") {
    return (
      <div
        className="recent-add"
        onClick={() => {
          dispatch(updateMessageWidgetStatus({ mode: "space" }));
        }}
      >
        <ion-icon name="close-sharp"></ion-icon>
      </div>
    );
  } else if (msgMode === "space" && mode === "spaces") {
    return (
      <div
        className="recent-add"
        onClick={() => {
          dispatch(updateMessageWidgetStatus({ mode: "form" }));
        }}
      >
        <ion-icon name="add-sharp"></ion-icon>
      </div>
    );
  } else if (msgMode === "space" && mode === "search") {
    return (
      <div
        className="recent-add"
        onClick={() => {
          setInputText("");
          dispatch(updateWidgetStatus({ mode: "spaces" }));
        }}
      >
        <ion-icon name="close-sharp"></ion-icon>
      </div>
    );
  }
};
