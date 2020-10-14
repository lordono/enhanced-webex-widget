import React from "react";
import { useSelector } from "react-redux";

import { HuntingRow } from "./HuntingRow";
import "../Recent/Recent.scss";
import "./Hunting.scss";

export const Hunting = () => {
  const spaces = useSelector(state => state.spaces.ids);
  return (
    <div className="app-content-hunting">
      <div className="App-recent">
        <div className="recent-sort">Sort by: </div>
        <div className="recent-content">
          {spaces.map(i => {
            return <HuntingRow key={i} id={i} />;
          })}
        </div>
      </div>
    </div>
  );
};
