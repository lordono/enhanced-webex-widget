import React, { useContext } from "react";
import filesize from "filesize";
import { saveAs } from "file-saver";

import LoadingImg from "../../../img/loading.svg";
import { FilesContext } from "../../../features/files/filesStore";

export const SpaceImage = ({ activity }) => {
  const { files } = useContext(FilesContext);
  return (
    <div>
      {activity.object.files.map(item => {
        let content = LoadingImg;
        if (
          Object.keys(files).includes(item.url) &&
          !files[item.url].isFetching
        ) {
          content = URL.createObjectURL(files[item.url].blob);
        }
        return (
          <div className="img-container" key={item.url}>
            <img
              src={content}
              alt={item.url}
              width={300}
              height={(item.height * 300) / item.width}
            />
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
