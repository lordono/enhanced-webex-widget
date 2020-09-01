import React from "react";
import clsx from "clsx";
import "./Separator.scss";

export const Separator = ({ primaryText, isInformative = false }) => {
  const mainClass = clsx("separator", isInformative && "informative");
  return (
    <div className={mainClass}>
      <p className="separator-text">{primaryText}</p>
    </div>
  );
};
