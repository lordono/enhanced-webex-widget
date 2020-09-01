import { createSelector } from "@reduxjs/toolkit";
import {
  parseISO,
  endOfDay,
  endOfMinute,
  differenceInDays,
  differenceInMinutes
} from "date-fns";
import { isActivityVisible } from "./helpers";

import { selectSpaceById } from "../spaces/spacesSlice";
import { selectActivitiesEntities } from "./activitiesSlice";
import { selectCurrentUser } from "../users/usersSlice";

const ITEM_TYPE_ACTIVITY = "ITEM_TYPE_ACTIVITY";
const ITEM_TYPE_DAY_SEPARATOR = "ITEM_TYPE_DAY_SEPARATOR";
const ITEM_TYPE_NEW_MESSAGE_SEPARATOR = "ITEM_TYPE_NEW_MESSAGE_SEPARATOR";

// const getSendingActivities = (state) => state.activity;

/**
 * This loops through our conversation activities and computes an array
 * of 'visible activities' to be used with the ActivityList component
 */
export const getActivityList = createSelector(
  [
    selectSpaceById,
    selectActivitiesEntities,
    selectCurrentUser
    // getSendingActivities,
  ],
  (
    space,
    activities,
    currentUser
    // sendingActivities,
  ) => {
    // const inFlightActivities = sendingActivities.get('inFlightActivities');
    // const activityFailures = sendingActivities.get('activityFailures');

    const lastAcknowledgedActivityId = space.lastAcknowledgedActivityId;
    const visibleActivityList = [];
    const now = new Date();
    let lastActorId, lastDay, lastMinute, lastVerb;
    let shouldDisplayNewMessageMarker = false;

    space.activities.forEach(activityId => {
      const activity = activities[activityId];
      if (isActivityVisible(activity)) {
        // Insert day separator if this activity and last one happen on a different day
        const activityDay = endOfDay(parseISO(activity.published));
        const activityMinute = endOfMinute(parseISO(activity.published));

        const sameDay = differenceInDays(activityDay, lastDay) === 0;
        const sameMinute = differenceInMinutes(activityMinute, lastMinute) <= 5;

        if (lastDay && !sameDay) {
          visibleActivityList.push({
            type: ITEM_TYPE_DAY_SEPARATOR,
            fromDate: lastDay,
            key: `day-separator-${activity.id}`,
            now,
            toDate: activityDay
          });
        }
        lastDay = activityDay;
        lastMinute = activityMinute;

        // New message marker
        if (shouldDisplayNewMessageMarker) {
          visibleActivityList.push({
            type: ITEM_TYPE_NEW_MESSAGE_SEPARATOR,
            key: `new-messages-${activity.id}`
          });
          shouldDisplayNewMessageMarker = false;
        }

        // Actual visible activity item
        // additional items don't repeat user avatar and name
        const isAdditional =
          sameDay &&
          sameMinute &&
          lastActorId === activity.actor.id &&
          lastVerb === activity.type;

        lastActorId = activity.actor.id;
        lastVerb = activity.type;

        // let formattedActivity = activity;

        // if (activity.verb === "post") {
        //   formattedActivity = Object.assign({}, activity, {
        //     object: formatActivity(activity.object)
        //   });
        // }

        // Name of the user
        let name = null;

        if (
          (activity.type === "add" || activity.type === "leave") &&
          activity.object.objectType === "person"
        ) {
          name = activity.object.displayName;
        }

        // start of conversation
        let creation = false;
        if (
          activity.type === "create" &&
          activity.object.objectType === "conversation"
        ) {
          creation = true;
        }

        const visibleActivity = {
          type: ITEM_TYPE_ACTIVITY,
          id: activity.id,
          isAdditional,
          isSelf: currentUser.id === activity.actor,
          currentUser: currentUser.id,
          name,
          creation
        };

        visibleActivityList.push(visibleActivity);

        // Check if this is the last read activity
        const isLastAcked =
          lastAcknowledgedActivityId &&
          lastAcknowledgedActivityId === activity.id;
        const isNotSelf = currentUser.id !== activity.actor.id;

        if (isLastAcked && isNotSelf) {
          shouldDisplayNewMessageMarker = true;
        }
      }
    });

    // // Create a "fake" activity to display in flight activities
    // inFlightActivities.forEach((inFlightActivity) => {
    //   visibleActivityList.push({
    //     currentUser,
    //     type: ITEM_TYPE_ACTIVITY,
    //     activity: inFlightActivity,
    //     isAdditional: false,
    //     isFlagged: false,
    //     isFlagPending: false,
    //     isSelf: true,
    //     isPending: true
    //   });
    // });

    // // Create a "fake" activity to display failed activities
    // activityFailures.forEach((activityFailure) => {
    //   visibleActivityList.push({
    //     currentUser,
    //     type: ITEM_TYPE_ACTIVITY,
    //     activity: activityFailure,
    //     isAdditional: false,
    //     hasError: true,
    //     isFlagged: false,
    //     isFlagPending: false,
    //     isSelf: true,
    //     isPending: true
    //   });
    // });

    return visibleActivityList;
  }
);
