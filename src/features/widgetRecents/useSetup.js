import { useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FEATURES_GROUP_MESSAGE_NOTIFICATIONS,
  FEATURES_MENTION_NOTIFICATIONS,
  FEATURES_USER,
  SPACE_TYPE_ONE_ON_ONE
} from "@webex/react-component-utils";

import { StoreContext } from "../webex/webexStore";
// import { fetchAvatar } from "../avatars/avatarsSlice";
import { getFeature } from "../feature/featureSlice";
import { fetchSpacesPaginate } from "../spaces/spacesSlice";
import { connectToMercury } from "../mercury/mercurySlice";
import { storeUser } from "../users/usersSlice";
import { updateStatus as updateWidgetStatus } from "./widgetRecentsSlice";
// import { getRecentsWidgetProps } from "./selectors";
import { getToParticipant, getSpaceAvatar } from "./helpers";

/**
 * Store the "to" participant in a 1:1 convo
 * This user is needed in our store to calculate a space title
 *
 * @param {object} space
 * @param {object} props
 */
const storeToParticipant = space => (dispatch, getState) => {
  const { users } = getState();

  // Store the to user in a direct convo to calculate space title
  if (space.type === SPACE_TYPE_ONE_ON_ONE) {
    // Find the participant that is not the current user
    const toPerson = getToParticipant(space, users.currentUserId);
    if (toPerson) {
      dispatch(storeUser(toPerson));
    }
  }
};

/**
 * Connects to the websocket server (mercury)
 * @param {object} props
 */
const connectWebsocket = webexInstance => (dispatch, getState) => {
  const mercuryStatus = getState().mercury.status;

  if (
    !mercuryStatus.hasConnected &&
    !mercuryStatus.connecting &&
    !mercuryStatus.connected &&
    webexInstance.internal.device.registered
  ) {
    dispatch(connectToMercury(webexInstance));
  }
};

/**
 * Gets the user's feature flags
 *
 * @param {object} props
 */
const getFeatures = webexInstance => (dispatch, getState) => {
  const { widgetRecents } = getState();
  const widgetStatus = widgetRecents.status;

  // Initial fetching of group message notification feature
  if (!widgetStatus.hasFetchedGroupMessageNotificationFeature) {
    dispatch(
      getFeature(
        FEATURES_USER,
        FEATURES_GROUP_MESSAGE_NOTIFICATIONS,
        webexInstance
      )
    ).then(() =>
      dispatch(
        updateWidgetStatus({ hasFetchedGroupMessageNotificationFeature: true })
      )
    );
  }

  // Initial Fetching of mention notification feature
  if (!widgetStatus.hasFetchedMentionNotificationFeature) {
    dispatch(
      getFeature(FEATURES_USER, FEATURES_MENTION_NOTIFICATIONS, webexInstance)
    ).then(() =>
      dispatch(
        updateWidgetStatus({ hasFetchedMentionNotificationFeature: true })
      )
    );
  }
};

/**
 * Fetches the initial space list from services
 *
 * @param {object} props
 */
const getAllSpaces = webexInstance => (dispatch, getState) => {
  const { widgetRecents } = getState();
  const widgetStatus = widgetRecents.status;

  if (
    !widgetStatus.isFetchingInitialSpaces &&
    !widgetStatus.hasFetchedInitialSpaces
  ) {
    dispatch(updateWidgetStatus({ isFetchingInitialSpaces: true }));

    /**
     * Fetches an encrypted small batch of spaces
     * This allows us to show the encrypted spaces in the spaces list
     * and decrypt individually to give a good initial user experience.
     */
    dispatch(fetchSpacesPaginate(webexInstance, { conversationsLimit: 25 }))
      .then(spaces => {
        // dispatch(
        //   updateWidgetStatus({
        //     isFetchingInitialSpaces: false,
        //     hasFetchedInitialSpaces: true,
        //     isFetchingAllSpaces: true
        //   })
        // );
        // let allParticipants = [];

        spaces.forEach(space => {
          // put all participants into an array for presence
          // allParticipants = allParticipants.concat(
          //   space.participants.map(i => i.id)
          // );

          // Store the to user in a direct convo to calculate space title
          if (space.type === SPACE_TYPE_ONE_ON_ONE) {
            dispatch(storeToParticipant(space));
          }
        });

        // allParticipants = allParticipants.filter(
        //   (item, index, self) => index === self.findIndex(t => t === item)
        // );
        // console.log(allParticipants);
        // webexInstance.internal.presence.list(allParticipants).then(response => {
        //   console.log(response);
        // });
      })
      .then(() => {
        dispatch(
          updateWidgetStatus({
            isFetchingAllSpaces: false,
            hasFetchedAllSpaces: true
          })
        );
      });
  }
};

/**
 * Fetches the avatars for all the loaded spaces
 *
 * @param {object} props
 */
export const getAvatars = webexInstance => (dispatch, getState) => {
  const { widgetRecents, spaces } = getState();
  const widgetStatus = widgetRecents.status;
  const spacesList = Object.values(spaces.entities);

  if (!widgetStatus.hasFetchedAvatars && !widgetStatus.isFetchingAvatars) {
    dispatch(updateWidgetStatus({ isFetchingAvatars: true }));

    console.log(spacesList);

    spacesList.forEach(s => dispatch(getSpaceAvatar(s, webexInstance)));

    dispatch(updateWidgetStatus({ hasFetchedAvatars: true }));
  }
};

/**
 * The main setup process that proceeds through a series of events
 * based on the state of the application.
 *
 * @export
 * @param {*} props
 */
export const useSetup = () => {
  const dispatch = useDispatch();
  const [webexInstance] = useContext(StoreContext);
  const widgetStatus = useSelector(state => state.widgetRecents.status);
  const mercuryStatus = useSelector(state => state.mercury.status);
  const webexStatus = useSelector(state => state.webex.status);

  // We cannot do anything until the sdk is ready
  useEffect(() => {
    if (
      webexInstance &&
      webexStatus.authenticated &&
      webexStatus.registered &&
      !webexStatus.hasError &&
      mercuryStatus.connected
    ) {
      if (!mercuryStatus.connected) {
        dispatch(connectWebsocket(webexInstance));
      } else {
        // Initial fetching workflow
        if (!widgetStatus.hasFetchedAllSpaces) {
          dispatch(getFeatures(webexInstance));
          dispatch(getAllSpaces(webexInstance));
          // } else if (!widgetStatus.hasFetchedAvatars) {
          //   dispatch(getAvatars(webexInstance));
        }
      }
    }
  }, [
    dispatch,
    webexInstance,
    webexStatus.authenticated,
    webexStatus.registered,
    webexStatus.hasError,
    mercuryStatus.connected,
    widgetStatus.hasFetchedAllSpaces
    // widgetStatus.hasFetchedAvatars
  ]);
};
