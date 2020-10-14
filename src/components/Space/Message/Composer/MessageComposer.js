import React, { useState, useEffect, useRef, useContext } from "react";
import clsx from "clsx";
import { useSelector, useDispatch } from "react-redux";
import { isImage, sanitize, constructFile } from "@webex/react-component-utils";
import { Editor, EditorState, RichUtils, Modifier } from "draft-js";
import { stateFromHTML } from "draft-js-import-html";
import { stateToMarkdown } from "draft-js-export-markdown";
import { stateToHTML } from "draft-js-export-html";
import { Picker } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";
import "draft-js/dist/Draft.css";
import "./MessageComposer.scss";

import { useTimer } from "../useTimer";
import { ComposeContext } from "../../../../features/compose/composeStore";
import { StoreContext } from "../../../../features/webex/webexStore";
import {
  constructActivity,
  constructActivityWithContent
} from "../../../../utils/activity";
import { myKeyBindingFn, createObjectURL, revokeObjectURL } from "./helpers";
import {
  updateCompose,
  resetCompose
} from "../../../../features/compose/composeSlice";
import { initializeComposeStore } from "../../../../features/compose/helpers";
import { updateSpaceWithActivity } from "../../../../features/spaces/spacesSlice";
import { storeActivities } from "../../../../features/activities/activitiesSlice";

export const MessageComposer = () => {
  const { composeStore, updateComposeStore } = useContext(ComposeContext);
  const [webex] = useContext(StoreContext);

  const dispatch = useDispatch();
  const selectedSpace = useSelector(
    state => state.spaces.entities[state.widgetMessage.selectedSpace]
  );
  const selectedCompose = useSelector(
    state => state.compose.entities[selectedSpace.id]
  );
  const currentUser = useSelector(
    state => state.users.entities[state.users.currentUserId]
  );

  const editorRef = useRef(null);
  const emojiRef = useRef(null);
  const fileInputRef = useRef(null);

  const clock = useTimer(5000);

  const [isTyping, setIsTyping] = useState(false);
  const [initial, setInitial] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [insertEmoji, setInsertEmoji] = useState(false);
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  const comStore = composeStore[selectedSpace.id];
  const files = comStore ? comStore.files : [];
  const emojiContainerClass = clsx("emoji-container", !showPicker && "hide");

  // handles initial change of selectedspace
  useEffect(() => {
    if (selectedSpace.id) {
      setInitial(true);
    }
  }, [selectedSpace.id]);
  useEffect(() => {
    if (initial) {
      setInitial(false);

      // setup files and shareActivity
      if (!Object.keys(composeStore).includes(selectedSpace.id)) {
        updateComposeStore(
          selectedSpace.id,
          initializeComposeStore({ id: selectedSpace.id })
        );
      }

      // setup editor messages if available
      if (selectedCompose.content) {
        setEditorState(() =>
          EditorState.createWithContent(stateFromHTML(selectedCompose.content))
        );
      } else {
        setEditorState(() => EditorState.createEmpty());
      }
      // focus on editor after change
      editorRef.current.focus();
    }
  }, [
    initial,
    selectedSpace.id,
    selectedCompose.content,
    composeStore,
    updateComposeStore
  ]);

  // handle file uploads
  const handleAddFiles = event => {
    // create shareActivity if it is not created
    let shareActivity = comStore.shareActivity;
    const conversation = JSON.parse(JSON.stringify(selectedSpace));
    if (!shareActivity) {
      shareActivity = webex.internal.conversation.makeShare(conversation);
    }

    // format files
    const filesUploaded = event.target.files;
    const formattedFiles = [];
    for (let file of Array.from(filesUploaded)) {
      const fileIsImage = isImage(file);
      const cleanFile = sanitize(constructFile(file));
      const formattedFile = Object.assign(cleanFile, {
        isImage: fileIsImage,
        thumbnail: fileIsImage ? createObjectURL(file) : null
      });
      formattedFiles.push(formattedFile);
    }

    // add files to shareActivity
    formattedFiles.forEach(file => shareActivity.add(file));

    // store files and shareActivity to composeStore
    const newFileList = files.concat(formattedFiles);
    updateComposeStore(selectedSpace.id, { files: newFileList, shareActivity });

    // reset the value of input
    fileInputRef.current.value = "";
  };

  const removeFile = file => {
    const shareActivity = comStore.shareActivity;
    if (shareActivity) {
      shareActivity.remove(file).then(() => {
        const index = comStore.files.findIndex(i => i.id === file.id);
        const newFileList = comStore.files.slice();
        newFileList.splice(index, 1);
        updateComposeStore(selectedSpace.id, { files: newFileList });
        revokeObjectURL(file.thumbnail);
      });
    }
  };

  // handle emoji click
  const clickEmoji = emoji => {
    const contentState = Modifier.insertText(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      emoji.native,
      editorState.getCurrentInlineStyle()
    );
    const newState = EditorState.push(editorState, contentState);

    setEditorState(newState);
    setInsertEmoji(true);
    setShowPicker(false);
  };

  // focus after inserting emoji
  useEffect(() => {
    const selection = editorState.getSelection();
    if (!selection.hasFocus && insertEmoji) {
      editorRef.current.focus();
      setInsertEmoji(false);
    }
  }, [editorState, insertEmoji]);

  // handle click outside of emoji
  useEffect(() => {
    const monitorClick = e => {
      if (!emojiRef.current.contains(e.target)) {
        // outside click
        if (showPicker) {
          setShowPicker(false);
        }
      }
    };

    // add when mounted
    document.addEventListener("mousedown", monitorClick);
    // return function to be called when unmounted
    return () => {
      document.removeEventListener("mousedown", monitorClick);
    };
  }, [showPicker]);

  // handle typing
  const handleTyping = (html, markdown) => {
    if (
      selectedCompose.content !== html ||
      selectedCompose.displayName !== markdown
    ) {
      dispatch(
        updateCompose({
          id: selectedCompose.id,
          content: html,
          displayName: markdown
        })
      );
    }
  };
  const onEditorChange = newEditorState => {
    const markdown = stateToMarkdown(newEditorState.getCurrentContent());
    const html = stateToHTML(newEditorState.getCurrentContent());
    handleTyping(html, markdown);
    setEditorState(newEditorState);

    // mark typing for webex
    if (!isTyping) {
      setIsTyping(true);
      webex.internal.conversation.updateTypingStatus(selectedSpace, {
        typing: true
      });
    }
  };
  // reset typing status every 5 seconds
  useEffect(() => {
    setIsTyping(false);
  }, [clock]);

  // handle key commands for editor
  const handleKeyCommand = (command, editorState) => {
    // submit handling
    if (command === "submit-conversation") {
      const markdown = stateToMarkdown(editorState.getCurrentContent()).trim();
      if (markdown.length === 0 && files.length === 0) {
        return "handled";
      } else {
        const html = stateToHTML(editorState.getCurrentContent());
        const activity = {
          objectType: "comment",
          displayName: markdown,
          content: html
        };

        if (comStore.shareActivity && files.length > 0) {
          // share activity
          const inFlightActivity = constructActivityWithContent(
            selectedSpace,
            activity,
            currentUser,
            comStore.files,
            comStore.shareActivity
          );

          // update activity to space
          dispatch(storeActivities([inFlightActivity])).then(() => {
            dispatch(updateSpaceWithActivity(inFlightActivity, true, true));
          });

          // map our temp id to the in flight temp id so we can remove it when it is received
          comStore.shareActivity.object = {
            displayName: activity.displayName,
            content: activity.content
          };
          comStore.shareActivity.clientTempId = inFlightActivity.clientTempId;

          // send activity to webex
          const conversation = JSON.parse(JSON.stringify(selectedSpace));
          webex.internal.conversation
            .share(conversation, comStore.shareActivity)
            .then(() => {
              // revoke files' urls to save memory
              files.forEach(file => {
                revokeObjectURL(file);
              });
            });
        } else {
          // post activity
          const inFlightActivity = constructActivity(
            selectedSpace,
            activity,
            currentUser
          );

          // update activity to space
          dispatch(storeActivities([inFlightActivity])).then(() => {
            dispatch(updateSpaceWithActivity(inFlightActivity, true, true));
          });

          // send activity to webex
          webex.internal.conversation.post(selectedSpace, activity, {
            clientTempId: inFlightActivity.clientTempId
          });
        }

        // reset composer
        dispatch(resetCompose(selectedSpace.id));
        updateComposeStore(
          selectedSpace.id,
          initializeComposeStore({ id: selectedSpace.id })
        );
        setEditorState(() =>
          EditorState.moveFocusToEnd(EditorState.createEmpty())
        );

        return "handled";
      }
    }

    // rich text handling
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }

    return "not-handled";
  };

  return (
    <div className="editor-container">
      <div className={emojiContainerClass} ref={emojiRef}>
        <Picker
          onSelect={clickEmoji}
          native={true}
          emojiSize={20}
          sheetSize={20}
        />
      </div>
      <div className="editor-options">
        <input
          type="file"
          name="filename"
          className="editor-file-input"
          ref={fileInputRef}
          onChange={handleAddFiles}
          multiple
        />
        <ion-icon
          class="editor-options-btn"
          name="attach"
          onClick={() => fileInputRef.current.click()}
        />
        <ion-icon
          class="editor-options-btn"
          name="happy"
          onClick={() => setShowPicker(true)}
        />
      </div>
      <div className="editor-files-staging">
        {files.length > 0 &&
          files.map(file => {
            return (
              <div className="editor-file-staged" key={file.id}>
                {file.isImage && (
                  <div className="editor-file-img">
                    <img src={file.thumbnail} alt={file.displayName} />
                  </div>
                )}
                {!file.isImage && (
                  <div className="editor-file-img">
                    <ion-icon name="document"></ion-icon>
                  </div>
                )}
                <div className="editor-file-main">
                  <div className="editor-file-title">{file.displayName}</div>
                  <div className="editor-file-size">{file.fileSizePretty}</div>
                </div>
                <div
                  className="editor-file-remove"
                  onClick={() => removeFile(file)}
                >
                  <ion-icon name="close-circle"></ion-icon>
                </div>
              </div>
            );
          })}
      </div>
      <div className="editor">
        <Editor
          ref={editorRef}
          editorState={editorState}
          placeholder="Message to ..."
          onChange={onEditorChange}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={myKeyBindingFn}
        />
      </div>
    </div>
  );
};
