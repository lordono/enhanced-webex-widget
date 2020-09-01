import React from "react";
import { useSelector } from "react-redux";
import { SpaceBox } from "./SpaceBox";
import { Loading } from "../Loading/Loading";

import MeetingImg from "../../img/meeting.png";
import LoadingImg from "../../img/loading.svg";

import "./Space.scss";
import { SpaceForm } from "./Form/SpaceForm";

export const Space = () => {
  const { mode, selectedSpace, creatingSpace } = useSelector(
    state => state.widgetMessage
  );
  return (
    <div className="App-space">
      {mode === "form" && <SpaceForm />}
      {mode === "space" && creatingSpace && (
        <Loading img={LoadingImg} text="Cooking up the Space right now..." />
      )}
      {mode === "space" && !creatingSpace && !selectedSpace && (
        <div className="placeholder">
          <img src={MeetingImg} alt="Meeting" />
          <span>Please select a room to chat in.</span>
        </div>
      )}
      {mode === "space" && !creatingSpace && selectedSpace && (
        <SpaceBox id={selectedSpace} />
      )}
    </div>
  );
};
