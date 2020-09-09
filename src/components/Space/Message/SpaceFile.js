import React, { useContext } from "react";
import { bufferToBlob } from "@webex/react-component-utils";
import filesize from "filesize";
import { saveAs } from "file-saver";

import { StoreContext } from "../../../features/webex/webexStore";

export const SpaceFile = ({ activity }) => {
  const [webex] = useContext(StoreContext);

  const downloadFile = item => {
    webex.internal.conversation.download(item).then(file => {
      const { blob } = bufferToBlob(file);
      saveAs(blob, item.displayName);
    });
  };
  return (
    <div>
      {activity.object.files.map(item => {
        return (
          <div className="file-container" key={item.url}>
            <div className="file-main">
              <ion-icon name="document-attach-sharp" class="file-icon" />
              <div className="file-details">
                <div className="file-filename">{item.displayName}</div>
                <div className="file-filesize">{filesize(item.fileSize)}</div>
              </div>
            </div>

            <div className="file-download" onClick={() => downloadFile(item)}>
              <ion-icon name="download-outline" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
