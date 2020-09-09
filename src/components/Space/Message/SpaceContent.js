import React from "react";
import ReactHtmlParser from "react-html-parser";

import { SpaceImage } from "./SpaceImage";
import { SpaceFile } from "./SpaceFile";

export const SpaceContent = ({ activity }) => {
  let fileContent = null;
  let textContent = null;
  if (activity.type === "share") {
    if (
      activity.object.objectType === "content" &&
      activity.object.contentCategory === "images"
    ) {
      fileContent = <SpaceImage activity={activity} />;
    } else if (activity.object.contentCategory === "documents") {
      fileContent = <SpaceFile activity={activity} />;
    }
  }
  if (activity.object.content) {
    textContent = ReactHtmlParser(activity.object.content);
  } else if (activity.object.displayName) {
    textContent = activity.object.displayName;
  }
  return (
    <>
      {fileContent}
      {textContent}
    </>
  );
};
