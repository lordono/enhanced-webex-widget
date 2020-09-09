import { API_ACTIVITY_VERB } from "@webex/react-component-utils";
import { filterSync } from "@webex/helper-html";

import defaultFormatters from "./formatters";

export function constructActivity(activity) {
  return {
    id: activity.id,
    actor: activity.actor ? activity.actor.id : undefined,
    type: activity.verb,
    objectType: activity.objectType,
    published: activity.published,
    object: activity.object,
    url: activity.url,
    parentId: activity.parent ? activity.parent.id : null,
    isReply: activity.activityType && activity.activityType === "reply"
  };
}

export function constructActivities(activities) {
  return activities.map(constructActivity);
}

/**
 * Parses the giphy file object and set the url correctly
 * @param {Object} fileObject
 * @returns {Object}
 */
function convertGiphyFileObject(fileObject) {
  const normalizedFileObject = Object.assign({}, fileObject);

  normalizedFileObject.image.displayName = fileObject.displayName;
  normalizedFileObject.url = fileObject.scr.loc;
  // Set scr to null so we don't try to decrypt content in the sdk
  normalizedFileObject.scr = null;

  return normalizedFileObject;
}

/**
 * Normalizes an activity received from the conversation service
 * @param {Object} a
 * @returns {Object}
 */
export function normalizeActivity(a) {
  let activity = Object.assign({}, a);

  if (
    activity.verb === "share" &&
    activity.object &&
    activity.object.files &&
    Array.isArray(activity.object.files.items)
  ) {
    // Apply giphy fix to file url
    activity.object.files.items = activity.object.files.items.map(
      fileObject => {
        if (fileObject.url.includes("giphy")) {
          return convertGiphyFileObject(fileObject);
        }

        return fileObject;
      }
    );
  }

  // normalize the object and drop all scrs
  if (activity.object && activity.object.files) {
    activity = {
      ...activity,
      object: {
        ...activity.object,
        files: activity.object.files.items.map(item => {
          const returnItem = {};
          for (let i of Object.keys(item)) {
            if (
              [
                "objectType",
                "url",
                "displayName",
                "fileSize",
                "mimeType",
                "encryptionKeyUrl"
              ].includes(i)
            ) {
              returnItem[i] = item[i];
            } else if (i === "image") {
              returnItem.width = item.image.width;
              returnItem.height = item.image.height;
            }
          }
          return returnItem;
        })
      }
    };
  }

  return activity;
}

/**
 * Normalizes an array of activities received from the conversation service
 * @param {Array} activities
 * @returns {Array}
 */
export function normalizeActivities(activities) {
  return activities.map(normalizeActivity);
}

/**
 * Filters a raw list of activities for those we are interested in
 *
 * @param {array} activities
 * @returns {array}
 */
export function filterActivities(activities) {
  return activities.filter(a => {
    const isUpdate = a.verb === API_ACTIVITY_VERB.UPDATE;
    const isContent = a.object && a.object.objectType === "content";
    let shouldInclude = true;

    // Content updates show up out of order and should not be displayed
    if (isUpdate && isContent) {
      shouldInclude = false;
    }

    return shouldInclude;
  });
}

// not handling locus properly...
export const VISIBLE_ACTIVITY_VERBS = {
  tombstone: {},
  share: {
    objectTypes: ["content"]
  },
  post: {
    objectTypes: ["comment"]
  },
  create: {
    objectTypes: ["conversation"]
  },
  // update: {
  //   objectTypes: ["locusSessionSummaryParticipant", "locusSessionSummary"]
  // },
  add: {
    objectTypes: ["person"]
  },
  leave: {
    objectTypes: ["person"]
  }
};

export const LYRA_SPACE_TYPE = "LYRA_SPACE";

/**
 * Determines if an activity object is a visible activity
 * @param {object} activity
 * @returns {bool}
 */
export function isActivityVisible(activity) {
  if (activity.object) {
    const { type } = activity.object;

    // Do not show activity if its object type is 'LYRA_SPACE'
    if (type === LYRA_SPACE_TYPE) {
      return false;
    }
  }

  // remove threads
  if (activity.activityType && activity.activityType === "reply") {
    return false;
  } else if (activity.isReply) {
    return false;
  }

  if (
    !Object.prototype.hasOwnProperty.call(VISIBLE_ACTIVITY_VERBS, activity.type)
  ) {
    // console.log("activity has wrong verbs", activity);
    return false;
  }

  const verb = VISIBLE_ACTIVITY_VERBS[activity.type];

  if (verb.objectTypes) {
    if (verb.objectTypes.indexOf(activity.object.objectType) === -1) {
      console.log("activity has wrong objectTypes", activity);
      return false;
    }
  }

  return true;
}

/**
 * Applies safe filters activity content
 *
 * @param {Object} activityObject raw activity.object
 * @returns {Object}
 */

export function filterActivity(activityObject) {
  const outputActivity = Object.assign({}, activityObject);

  if (outputActivity.content) {
    outputActivity.content = filterSync(
      () => {},
      {
        "spark-mention": [
          "data-object-type",
          "data-object-id",
          "data-object-url"
        ],
        a: ["href"],
        b: [],
        blockquote: ["class"],
        strong: [],
        i: [],
        em: [],
        pre: [],
        code: ["class"],
        br: [],
        hr: [],
        p: [],
        ul: [],
        ol: [],
        li: [],
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: []
      },
      [],
      outputActivity.content
    );
  }

  return outputActivity;
}

/**
 * Applies additional formatting to activity
 *
 * @export
 * @param {Object} activityObject
 * @returns {Object}
 */

export function formatActivity(activity) {
  const activityObject = filterActivity(activity);

  return defaultFormatters(activityObject);
}
