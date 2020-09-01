import { createSelector } from "@reduxjs/toolkit";

import {
  SPACE_TYPE_ONE_ON_ONE,
  SPACE_TYPE_GROUP
} from "@webex/react-component-utils";

import { selectAllSpaces } from "../spaces/spacesSlice";
import { selectAllActivities } from "../activities/activitiesSlice";
import { selectCurrentUser, selectAllUsers } from "../users/usersSlice";
import { selectAllAvatars } from "../avatars/avatarsSlice";
import { selectWidgetRecents } from "./widgetRecentsSlice";
import { selectMercuryStatus } from "../mercury/mercurySlice";
import { selectWebex } from "../webex/webexSlice";
import { selectAllFeatures } from "../feature/featureSlice";

import { constructGroup, constructOneOnOne } from "./construct";

const getWidgetProps = (_, props) => props;

const getRecentSpaces = createSelector(
  [
    selectAllSpaces,
    selectAllActivities,
    selectCurrentUser,
    selectAllUsers,
    selectWidgetRecents,
    getWidgetProps
  ],
  (spaces, activities, currentUser, users, widget, widgetProps) => {
    const recents = [];

    const spaceType = widget.spaceType;

    Object.values(spaces).forEach(space => {
      if (!space.isHidden && !space.isFetching) {
        let constructedSpace;

        if (space.type === "direct") {
          constructedSpace = constructOneOnOne({ space, users, currentUser });
        } else {
          constructedSpace = constructGroup({ space });
        }

        // Get Latest Activity
        const activity = activities[space.latestActivity];

        if (activity) {
          const actorId = activity.actor;
          const actor = users[actorId];

          constructedSpace.latestActivity = {
            actorName:
              actor && actor.displayName ? actor.displayName.split(" ")[0] : "",
            type: activity.type,
            object: activity.object,
            text: activity.object && activity.object.displayName,
            actor,
            tags: space.tags
          };
        }

        if (space.isDecrypting) {
          constructedSpace.name = "Decrypting Space...";
        }
        recents.push(constructedSpace);
      }
    });

    // filter space list by type
    if (
      spaceType &&
      [SPACE_TYPE_ONE_ON_ONE, SPACE_TYPE_GROUP].includes(spaceType)
    ) {
      return recents.filter(space => space.type === spaceType);
    }

    return recents;
  }
);

export const getRecentSpacesWithDetail = createSelector(
  [getRecentSpaces, selectAllAvatars, selectWidgetRecents],
  (recentSpaces, avatars, widget) => {
    const keyword = widget.keyword;
    const spaces = recentSpaces.map(space => {
      const s = space;

      // Get Avatar
      if (Object.keys(avatars).length) {
        if (s.type === "direct") {
          s.avatarUrl = avatars[s.toPersonId];
        } else {
          s.avatarUrl = avatars[s.id];
        }
      }

      return s;
    });

    if (keyword && keyword.length > 0) {
      const filteredSpaces = spaces.filter(sp => {
        const { name } = sp;

        if (keyword && name.toLowerCase().includes(keyword.toLowerCase())) {
          return true;
        }

        return false;
      });

      return filteredSpaces;
    }

    return spaces;
  }
);

const getCurrentUserWithAvatar = createSelector(
  [selectCurrentUser, selectAllAvatars],
  (currentUser, avatars) => {
    let user;

    if (currentUser && currentUser.id) {
      user = Object.assign({}, currentUser, { img: avatars[currentUser.id] });
    }

    return user;
  }
);

export const getRecentsWidgetProps = createSelector(
  [
    selectWidgetRecents,
    getRecentSpacesWithDetail,
    selectAllSpaces,
    selectWebex,
    selectAllFeatures,
    selectMercuryStatus,
    getCurrentUserWithAvatar
  ],
  (
    widget,
    spacesList,
    spacesById,
    webex,
    features,
    mercuryStatus,
    currentUserWithAvatar
  ) => {
    let lastActivityDate;

    if (spacesList && spacesList.length) {
      const lastSpace = spacesList[spacesList.length - 1];
      lastActivityDate = lastSpace.lastActivityTimestamp;
    }

    return {
      widgetStatus: widget.status,
      keywordFilter: widget.keyword,
      sparkState: webex.status,
      widgetRecents: widget,
      features,
      spacesById,
      spacesList,
      spacesListArray: spacesList,
      lastActivityDate,
      mercuryStatus: mercuryStatus,
      currentUserWithAvatar: currentUserWithAvatar || {}
    };
  }
);
