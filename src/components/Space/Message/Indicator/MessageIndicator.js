import React from "react";
import { useSelector } from "react-redux";
import clsx from "clsx";
import { useTimer } from "../useTimer";
import { differenceInSeconds, parseISO } from "date-fns";
import LoadingSvg from "../../../../img/ellipsis.svg";
import "./MessageIndicator.scss";

export const MessageIndicator = ({ spaceId }) => {
  const indicator = useSelector(state => state.indicator.entities[spaceId]);
  const users = useSelector(state => state.users.entities);
  const currentDate = useTimer();
  const typing = indicator ? indicator.typing : [];

  // ensure those in the list are still typing
  const currentTyping = typing.filter(
    i => differenceInSeconds(currentDate, parseISO(i.date)) < 5
  );

  // show/hide loading svg
  const loadingClass = clsx(
    "indicator-img",
    currentTyping.length === 0 && "hide"
  );

  const typingText = () => {
    // if no one is typing
    if (currentTyping.length === 0) return null;
    // else format the text to display
    let pronoun = "is";
    const firstUser = users[currentTyping[0].id].displayName;
    let secondUser;
    if (currentTyping.length > 1) {
      pronoun = "are";
      secondUser = users[currentTyping[1].id].displayName;
    }
    let theRest;
    if (currentTyping.length > 2) {
      theRest = `${currentTyping.length - 2} other`;
    }
    return (
      <span>
        <b>{firstUser}</b>
        {secondUser && (
          <span>
            &nbsp;and <b>{secondUser}</b>
          </span>
        )}
        {theRest && (
          <span>
            &nbsp;and <b>{theRest}</b>
          </span>
        )}
        <span>&nbsp;{pronoun} typing...</span>
      </span>
    );
  };

  return (
    <div className="indicator-container">
      <img className={loadingClass} src={LoadingSvg} alt="load" />
      {typingText()}
    </div>
  );
};
