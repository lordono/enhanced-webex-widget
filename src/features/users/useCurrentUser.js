import { useEffect, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";

import { fetchCurrentUser } from "./usersSlice";
import { StoreContext } from "../webex/webexStore";

export const useCurrentUser = () => {
  const [webex] = useContext(StoreContext);
  const currentUserId = useSelector(state => state.users.currentUserId);
  const webexRegistered = useSelector(state => state.webex.status.registered);

  const dispatch = useDispatch();
  useEffect(() => {
    if (webex && webexRegistered && !currentUserId) {
      console.log("getting current user");
      dispatch(fetchCurrentUser(webex));
    }
  }, [dispatch, currentUserId, webex, webexRegistered]);
};
