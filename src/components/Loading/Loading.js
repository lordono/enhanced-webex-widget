import React from "react";
import "./Loading.scss";

export const Loading = props => {
  const { img, text, width = 35, fontSize = "calc(0.5vmin + 10px)" } = props;
  return (
    <div className="loading-window">
      <img style={{ width }} src={img} alt="Loading Conversations..." />
      <div className="loading-text" style={{ fontSize }}>
        {text}
      </div>
    </div>
  );
};
