import {
  SPACE_TYPE_GROUP,
  SPACE_TYPE_ONE_ON_ONE
} from "@webex/react-component-utils";

import { fetchAvatar } from "../avatars/avatarsSlice";

/**
 * Finds the participant in a direct space that isn't current user
 *
 * @param {object} space
 * @param {string} currentUserId
 * @returns {object} participant object
 */
export function getToParticipant(space, currentUserId) {
  return space.participants.find(p => p.id !== currentUserId);
}

/**
 * Gets the avatar for a space
 * Will fetch the user avatar for 1:1 spaces
 *
 * @export
 * @param {Object} space
 * @param {Object} props
 * @param {function} props.fetchAvatar redux action
 * @param {object} props.sparkInstance spark sdk instance
 * @param {object} props.users users redux store
 */
export const getSpaceAvatar = (space, webexInstance) => (
  dispatch,
  getState
) => {
  const state = getState();
  const { users } = state;

  if (!space.isDecrypting) {
    if (space.type === SPACE_TYPE_ONE_ON_ONE) {
      // Find the participant that is not the current user
      const toParticipant = getToParticipant(space, users.currentUserId);

      if (toParticipant) {
        // Direct spaces use the "other participant" as the space avatar
        dispatch(fetchAvatar({ userId: toParticipant.id }, webexInstance));
      }
    } else if (space.type === SPACE_TYPE_GROUP && space.id) {
      dispatch(fetchAvatar({ space }, webexInstance));
    }
  }
};
