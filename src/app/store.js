import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import errorsReducer from "../features/errors/errorsSlice";
import mercuryReducer from "../features/mercury/mercurySlice";
import avatarsReducer from "../features/avatars/avatarsSlice";
import activitiesReducer from "../features/activities/activitiesSlice";
import spacesReducer from "../features/spaces/spacesSlice";
import usersReducer from "../features/users/usersSlice";
import webexReducer from "../features/webex/webexSlice";
import featuresReducer from "../features/feature/featureSlice";
import widgetRecentsReducer from "../features/widgetRecents/widgetRecentsSlice";
import widgetMessageReducer from "../features/widgetMessage/widgetMessageSlice";
import indicatorsReducer from "../features/indicators/indicatorsSlice";
import reactionsReducer from "../features/reactions/reactionsSlice";
import threadsReducer from "../features/threads/threadsSlice";

export default configureStore({
  middleware: getDefaultMiddleware({
    serializableCheck: {
      // Ignore these action types
      ignoredActions: ["webex/storeWebex"],
      // Ignore these field paths in all actions
      ignoredActionPaths: ["payload.webex"],
      // Ignore these paths in the state
      ignoredPaths: ["webex"]
    }
  }),
  reducer: {
    errors: errorsReducer,
    mercury: mercuryReducer,
    indicators: indicatorsReducer,
    widgetRecents: widgetRecentsReducer,
    widgetMessage: widgetMessageReducer,
    avatars: avatarsReducer,
    activities: activitiesReducer,
    reactions: reactionsReducer,
    threads: threadsReducer,
    spaces: spacesReducer,
    users: usersReducer,
    features: featuresReducer,
    webex: webexReducer
  }
});
