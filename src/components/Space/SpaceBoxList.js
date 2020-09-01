import React from "react";
import { useSelector } from "react-redux";
import { formatDate } from "../formatDates";

import { SpaceBoxRow } from "./SpaceBoxRow";
import { Separator } from "../Separator/Separator";
import { getActivityList } from "../../features/activities/selectors";
import { SpaceBoxSystemUser } from "./System/SpaceBoxSystemUser";
import { SpaceBoxSystemCreate } from "./System/SpaceBoxSystemCreate";

export const SpaceBoxList = ({ id }) => {
  const activities = useSelector(state => getActivityList(state, id));

  // render Activity based on type
  const renderActivity = obj => {
    switch (obj.type) {
      case "ITEM_TYPE_ACTIVITY":
        if (obj.name) {
          return <SpaceBoxSystemUser key={obj.id} {...obj} />;
        } else if (obj.creation) {
          return <SpaceBoxSystemCreate key={obj.id} {...obj} />;
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

  return activities.map(activity => renderActivity(activity));
};
