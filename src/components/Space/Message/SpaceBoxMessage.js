import React from "react";

import LoadingImg from "../../../img/loading.svg";
import { Loading } from "../../Loading/Loading";

import { SpaceBoxList } from "./SpaceBoxList";
import { MessageComposer } from "./Composer/MessageComposer";
import { MessageIndicator } from "./Indicator/MessageIndicator";

export const SpaceBoxMessage = ({ space }) => {
  return (
    <>
      {space.hasFetchedActivities && <SpaceBoxList space={space} />}
      {!space.hasFetchedActivities && (
        <div className="msg-window">
          <Loading img={LoadingImg} text="Loading conversations..." />
        </div>
      )}
      {space.hasFetchedActivities && <MessageComposer />}
      {space.hasFetchedActivities && <MessageIndicator spaceId={space.id} />}
    </>
  );
};
