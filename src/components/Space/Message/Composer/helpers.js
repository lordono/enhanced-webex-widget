import { getDefaultKeyBinding } from "draft-js";

export function myKeyBindingFn(e) {
  if (
    e.keyCode === 13 /* `Enter` key */ &&
    !e.nativeEvent.shiftKey &&
    !e.nativeEvent.altKey &&
    !e.nativeEvent.ctrlKey
  ) {
    return "submit-conversation";
  }
  return getDefaultKeyBinding(e);
}

/**
 * Create objectURL
 *
 * @param {object} file
 * @returns {string}
 */
export function createObjectURL(file) {
  const urlCreator = window.URL || window.webkitURL;

  return urlCreator.createObjectURL(file);
}

/**
 * Revoke objectURL
 *
 * @param {object} file
 * @returns {undefined}
 */
export function revokeObjectURL(file) {
  const urlCreator = window.URL || window.webkitURL;

  urlCreator.revokeObjectURL(file);
}
