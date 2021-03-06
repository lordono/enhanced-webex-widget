import React, { useState, useContext } from "react";
import { useDispatch } from "react-redux";
import { unregisterDevice } from "./features/webex/webexSlice";
import { StoreContext } from "./features/webex/webexStore";
import { Base } from "./components/Base/Base";

import "./App.css";

function App({ token, onEvent }) {
  const [show, setShow] = useState(true);
  const dispatch = useDispatch();
  const [webex] = useContext(StoreContext);

  const onClick = () => {
    setShow(false);
    dispatch(unregisterDevice(webex));
  };
  return (
    <div>
      <button className="unregister-button" onClick={onClick}>
        Unregister
      </button>
      {show && <Base token={token} onEvent={onEvent} />}
    </div>
  );
}

export default App;
