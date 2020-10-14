import React from "react";
import { useSelector } from "react-redux";

import { Recent } from "../Recent/Recent";
import { Space } from "../Space/Space";
import { Loading } from "../Loading/Loading";
import LoadingSvg from "../../img/ellipsis.svg";

export const BaseMessage = () => {
  const widgetStatus = useSelector(state => state.widgetRecents.status);
  if (widgetStatus.isFetchingInitialSpaces) {
    return <Loading img={LoadingSvg} text="Fetching Spaces from Webex..." />;
  } else if (widgetStatus.hasFetchedInitialSpaces) {
    return (
      <>
        <Recent />
        <Space />
      </>
    );
  } else {
    // should return an error page here...
    return null;
  }
};
