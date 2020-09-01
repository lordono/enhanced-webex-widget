import Webex from "webex";
import LocalForageStoreAdapter from "@webex/storage-adapter-local-forage";

/**
 * Creates the default sdk config for the widgets
 * @param {Object} [options={}]
 * @returns {Object}
 */
function defaultConfig(options = {}) {
  return {
    appName: "webex-widgets",
    appVersion: process.env.REACT_WEBEX_VERSION,
    device: {
      ephemeral: true
    },
    logger: {
      level:
        options.logLevel || process.env.NODE_ENV === "production"
          ? "silent"
          : "trace"
    },
    conversation: {
      allowedInboundTags: {
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
        code: [],
        br: [],
        hr: [],
        p: [],
        ul: [],
        ol: [],
        li: [],
        h1: [],
        h2: [],
        h3: []
      },
      allowedOutboundTags: {
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
        code: [],
        br: [],
        hr: [],
        p: [],
        ul: [],
        ol: [],
        li: [],
        h1: [],
        h2: [],
        h3: []
      }
    },
    credentials: {
      client_id: process.env.WEBEX_CLIENT_ID,
      scope: "spark:all"
    },
    // Added to help load blocking during decryption
    encryption: {
      kmsInitialTimeout: 10000
    },
    meetings: {
      deviceType: "WEB"
    },
    phone: {
      enableExperimentalGroupCallingSupport: true
    },
    storage: {
      unboundedAdapter: new LocalForageStoreAdapter("webex-react-widgets")
    }
  };
}

/**
 * Creates a sdk instance with the access token
 * @param {string} accessToken
 * @param {object} options
 * @returns {Promise<object>}
 */
export function createSDKInstance(accessToken, options = {}) {
  const webexSDKInstance = new Webex({
    credentials: {
      authorization: {
        access_token: accessToken
      }
    },
    config: defaultConfig(options)
  });

  return Promise.resolve(webexSDKInstance);
}

/**
 * Creates a webex instance with the jwt token generated
 * by a guest issuer.
 * https://developer.webex.com/docs/guest-issuer
 *
 * @param {string} jwt
 * @param {object} options
 * @returns {Promise<object>}
 */
export function createSDKGuestInstance(jwt, options = {}) {
  const webexSDKInstance = new Webex({
    config: defaultConfig(options)
  });

  return webexSDKInstance.authorization
    .requestAccessTokenFromJwt({ jwt })
    .then(() => webexSDKInstance);
}
