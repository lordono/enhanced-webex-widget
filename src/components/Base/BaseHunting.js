import React from "react";
import { useSelector } from "react-redux";

import { Hunting } from "../Hunting/Hunting";
import { Loading } from "../Loading/Loading";
import LoadingSvg from "../../img/ellipsis.svg";

export const BaseHunting = () => {
  const widgetStatus = useSelector(state => state.widgetRecents.status);
  if (widgetStatus.isFetchingInitialSpaces) {
    return <Loading img={LoadingSvg} text="Fetching Spaces from Webex..." />;
  } else if (widgetStatus.hasFetchedInitialSpaces) {
    return <Hunting />;
  } else {
    // should return an error page here...
    return null;
  }
};
