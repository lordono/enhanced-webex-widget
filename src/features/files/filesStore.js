import React, { useState } from "react";
import { bufferToBlob } from "@webex/react-component-utils";

export const FilesContext = React.createContext(null);

export const saveFileFromActivities = (webex, filesStore, activity) => {
  const { files, updateFile } = filesStore;
  // Store files - ["files", "content"] - omitting files in case the size is huge...
  if (
    activity.object &&
    activity.object.objectType === "content" &&
    activity.object.contentCategory === "images"
  ) {
    activity.object.files.items.forEach(fileObject => {
      if (!Object.keys(files).includes(fileObject.url)) {
        const params = {
          name: fileObject.displayName,
          mimeType: fileObject.mimeType,
          fileSize: fileObject.fileSize
        };
        updateFile(fileObject.url, {
          ...params,
          isFetching: true
        });
        webex.internal.conversation.download(fileObject).then(file => {
          const { blob, objectUrl } = bufferToBlob(file);
          updateFile(fileObject.url, {
            ...params,
            isFetching: false,
            blob,
            objectUrl
          });
        });
      }
    });
  }
};

export default ({ children }) => {
  const [files, setFiles] = useState({});

  const updateFile = (id, obj) => {
    setFiles(e => {
      const newFileHash = { ...e };
      newFileHash[id] = obj;
      return newFileHash;
    });
  };

  const store = { files, updateFile };

  return (
    <FilesContext.Provider value={store}>{children}</FilesContext.Provider>
  );
};
