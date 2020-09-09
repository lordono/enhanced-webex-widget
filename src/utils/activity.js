import { v4 as uuidv4 } from "uuid";

import { isImage } from "@webex/react-component-utils";

/**
 * Constructs a default activity
 *
 * @export
 * @param {object} conversation
 * @param {object} activityObject
 * @param {any} actor
 * @returns {object}
 */
export function constructActivity(conversation, activityObject, actor) {
  const clientTempId = `cic-widget-${uuidv4()}`;

  return {
    actor: {
      displayName: actor.displayName,
      id: actor.id,
      objectType: "person"
    },
    // Needed for round trip
    clientTempId,
    id: clientTempId,
    // Minimum properties needed by API
    object: activityObject,
    objectType: "activity",
    target: {
      id: conversation.id,
      objectType: "conversation"
    },
    verb: "post",
    published: new Date().toISOString(),
    clientPublished: new Date().toISOString(),
    _status: "pending",
    _meta: {
      actor,
      conversation,
      text: activityObject
    }
  };
}

/**
 * Constructs a share activity
 *
 * @export
 * @param {object} conversation
 * @param {object} activityObject
 * @param {object} actor
 * @param {array} files
 * @param {object} shareActivity
 * @returns {object}
 */
export function constructActivityWithContent(
  conversation,
  activityObject,
  actor,
  files,
  shareActivity
) {
  const activity = constructActivity(conversation, activityObject, actor);

  activity.object.objectType = "content";
  activity.verb = "share";
  const items = files.map(file => {
    const item = Object.assign({}, file, {
      objectType: "file",
      url: file.clientTempId
    });

    if (isImage(file)) {
      item.image = {
        url: file.thumbnail
      };
    }

    return item;
  });

  activity.object.files = {
    items
  };
  // eslint-disable-reason _meta comes from SDK
  // eslint-disable-next-line no-underscore-dangle
  activity._meta.shareActivity = shareActivity;

  return activity;
}
