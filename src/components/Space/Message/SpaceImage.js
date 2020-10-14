import React, { useContext } from "react";
import Skeleton from "react-loading-skeleton";
import filesize from "filesize";
import { saveAs } from "file-saver";

import { FilesContext } from "../../../features/files/filesStore";

export const SpaceImage = ({ activity }) => {
  const { files } = useContext(FilesContext);
  return (
    <div>
      {activity.object.files.map(item => {
        const width = 300;
        const height = (item.height * 300) / item.width;
        let img = <Skeleton width={width} height={height} />;
        if (
          Object.keys(files).includes(item.url) &&
          !files[item.url].isFetching
        ) {
          const content = URL.createObjectURL(files[item.url].blob);
          img = (
            <img src={content} alt={item.url} width={width} height={height} />
          );
        }
        return (
          <div className="img-container" key={item.url}>
            {img}
            <div className="after">
              <div className="file-details">
                <div className="file-filename">{item.displayName}</div>
                <div className="file-filesize">{filesize(item.fileSize)}</div>
              </div>
              <div
                className="file-download"
                onClick={() => saveAs(files[item.url].blob, item.displayName)}
              >
                <ion-icon name="download-outline" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
