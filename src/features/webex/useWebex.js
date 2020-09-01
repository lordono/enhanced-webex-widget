import { useEffect, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";

import { add as addError } from "../errors/errorsSlice";
import {
  updateWebexStatus,
  registerDevice,
  storeWebexInstance
} from "./webexSlice";
import { createSDKInstance } from "./sdk";
import { getStatusFromInstance } from "./helpers";
import { StoreContext } from "./webexStore";

import { selectWebex } from "./webexSlice";

// const PLUGINS = [
//   "authorization",
//   "logger",
//   "meetings",
//   "people",
//   "phone",
//   "rooms"
// ];
// const INTERNAL_PLUGINS = [
//   "conversation",
//   "feature",
//   "flag",
//   "mercury",
//   "presence",
//   "search"
// ];

export const useWebex = accessToken => {
  const instance = useSelector(selectWebex);
  const [webex, setWebex] = useContext(StoreContext);
  const dispatch = useDispatch();

  useEffect(() => {
    /**
     * Register the device if the user has been authenticated
     * and the device is not registered yet.
     * @param {Object} webexInstance
     */
    function setupDevice(webexInstance) {
      const registering = instance.status.registering;
      const registerError = instance.status.registerError;

      const { authenticated, registered } = getStatusFromInstance(
        webexInstance
      );

      if (authenticated && !registered && !registering && !registerError) {
        dispatch(registerDevice(webexInstance));
      }
    }

    /**
     * Listen to any new events and update the webex instance
     * status accordingly
     * @param {Object} webexInstance
     */
    function listenToWebexEvents(webexInstance) {
      if (!instance.status.registered) {
        webexInstance.listenToAndRun(
          webexInstance,
          "change:canAuthorize",
          () => {
            dispatch(
              updateWebexStatus({
                authenticated: webexInstance.canAuthorize
              })
            );
          }
        );

        webexInstance.listenToAndRun(
          webexInstance,
          "change:isAuthenticating",
          () => {
            dispatch(
              updateWebexStatus({
                authenticating: webexInstance.isAuthenticating
              })
            );
          }
        );

        webexInstance.listenToAndRun(
          webexInstance.internal.device,
          "change:registered",
          () => {
            dispatch(
              updateWebexStatus({
                registered: webexInstance.internal.device.registered
              })
            );
          }
        );

        setupDevice(webexInstance);
      }
    }

    /**
     * Verify if all the plugins have been injected
     * properly to the webex SDK instance
     * @param {Object} sdkInstance
     * @returns {boolean}
     */
    // function verifyPlugins(sdkInstance) {
    //   let contains = false;
    //   let verified = true;

    //   for (const plugin of PLUGINS) {
    //     contains = Object.prototype.hasOwnProperty.call(sdkInstance, plugin);

    //     if (!contains) {
    //       dispatch(
    //         addError({
    //           id: "webex-plugins-missing",
    //           displayTitle: "Something's not right. Please try again",
    //           displaySubtitle: `Webex SDK instance plugin ${plugin} is not injected to the widget properly`,
    //           temporary: false
    //         })
    //       );
    //       verified = false;
    //     }
    //   }

    //   for (const internalPlugin of INTERNAL_PLUGINS) {
    //     contains = Object.prototype.hasOwnProperty.call(
    //       sdkInstance.internal,
    //       internalPlugin
    //     );

    //     if (!contains) {
    //       dispatch(
    //         addError({
    //           id: "webex-internal-plugins-missing",
    //           displayTitle: "Something's not right. Please try again",
    //           displaySubtitle: `Webex SDK instance internal plugin ${internalPlugin} is not injected to the widget properly`,
    //           temporary: false
    //         })
    //       );
    //       verified = false;
    //     }
    //   }

    //   return verified;
    // }

    /**
     * Verify for the plugins, store the webex instance
     * and listen to any events
     * @param {Object} sdkInstance
     */
    function storeSDKInstance(sdkInstance) {
      if (validateSDKInstance(sdkInstance)) {
        setWebex(sdkInstance);
        dispatch(storeWebexInstance(sdkInstance));
        listenToWebexEvents(sdkInstance);
      }
    }

    /**
     * Validates the sdk instance object and plugins
     *
     * @param {Object} sdkInstance
     * @returns {boolean}
     * @memberof WebexComponent
     */
    function validateSDKInstance(sdkInstance) {
      if (typeof sdkInstance !== "object") {
        dispatch(
          addError({
            id: "webex-sdk-instance-prop",
            displayTitle: "Something's not right. Please try again",
            displaySubtitle:
              "The 'sdkInstance' passed was invalid. Please pass a proper SDK Instance.",
            temporary: false
          })
        );

        return false;
      }

      return true;
      // skip for now
      // return verifyPlugins(sdkInstance);
    }

    // setup webex instance if it is unavailable in store
    if (!webex) {
      if (accessToken) {
        createSDKInstance(accessToken).then(storeSDKInstance);
      } else {
        dispatch(
          addError({
            id: "webex-sdk-config-props",
            displayTitle: "Something's not right. Please try again",
            displaySubtitle:
              "Missing initial configuration, please pass 'sdkInstance', 'accessToken', or 'guestToken'",
            temporary: false
          })
        );
      }
    }
  }, [
    webex,
    setWebex,
    accessToken,
    dispatch,
    instance.status.registered,
    instance.status.registering,
    instance.status.registerError
  ]);

  return instance;
};
