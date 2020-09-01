import { deconstructHydraId } from "@webex/react-component-utils";

export function constructUserFromParticipant(user) {
  return {
    id: user.id,
    displayName: user.displayName,
    nickName: user.displayName ? user.displayName.split(" ")[0] : "",
    email: user.emailAddress,
    orgId: user.orgId,
    status: {
      isFetching: false
    }
  };
}

export function constructUserFromHydra(user) {
  if (user) {
    return {
      id: deconstructHydraId(user.id).id,
      displayName: user.displayName,
      nickName: user.nickName,
      email: user.emails[0],
      orgId: deconstructHydraId(user.orgId).id,
      status: {
        isFetching: false
      }
    };
  }

  return {};
}

export function constructUser(user) {
  if ((user && user.nickName) || user.emails) {
    return constructUserFromHydra(user);
  }

  return constructUserFromParticipant(user);
}

export function constructCurrentUser(user) {
  return {
    id: user.id,
    displayName: user.name,
    nickName: user.givenName,
    email: user.email,
    orgId: user.orgId,
    status: {
      isFetching: false
    }
  };
}
