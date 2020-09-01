import { useEffect, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { connectToMercury } from "./mercurySlice";
import { StoreContext } from "../webex/webexStore";

export const useMercury = () => {
  const mercuryStatus = useSelector(state => state.mercury.status);
  const webexStatus = useSelector(state => state.webex.status);
  const dispatch = useDispatch();
  const [webex] = useContext(StoreContext);

  const { hasConnected, isConnecting, isConnected } = mercuryStatus;
  const { authenticated, registered } = webexStatus;

  useEffect(() => {
    if (
      webex &&
      authenticated &&
      registered &&
      !hasConnected &&
      !isConnecting &&
      !isConnected &&
      webex.internal.device.registered
    ) {
      dispatch(connectToMercury(webex));
    }
  }, [
    dispatch,
    webex,
    authenticated,
    registered,
    hasConnected,
    isConnected,
    isConnecting
  ]);
};
