import React from "react";
import { useSelector } from "react-redux";
import ReactTooltip from "react-tooltip";
import "./MessageReceipts.scss";

export const MessageReceipts = ({ readReceipts }) => {
  const currentUser = useSelector(state => state.users.currentUserId);
  const users = useSelector(state => state.users.entities);

  // exclude current user
  const otherReceipts = readReceipts.filter(i => i !== currentUser);

  const revealNumber = 8;
  const firstFewReceipts = otherReceipts.slice(0, revealNumber);
  const leftoverReceipts = otherReceipts.slice(revealNumber);

  const authorAvatar = (users, id) => {
    const author = users[id];
    const name = author.displayName.trim();
    const nameList = name.split(/\s/).map(i => i[0]);
    return nameList.slice(0, 2).join("");
  };

  return (
    <div className="receipts-container">
      {otherReceipts.length > 0 && <div className="receipt-start">Seen by</div>}
      {firstFewReceipts.map(i => (
        <div key={i}>
          <div className="receipt-avatar" data-tip data-for={i}>
            {authorAvatar(users, i)}
          </div>
          <ReactTooltip id={i} effect="solid">
            <span>{users[i].displayName}</span>
          </ReactTooltip>
        </div>
      ))}
      {leftoverReceipts.length > 0 && (
        <div>
          <div className="receipt-avatar" data-tip data-for="leftoverReceipts">
            +{leftoverReceipts.length}
          </div>
          <ReactTooltip id="leftoverReceipts" effect="solid">
            <>
              {leftoverReceipts.map(i => (
                <p key={i}>{users[i].displayName}</p>
              ))}
            </>
          </ReactTooltip>
        </div>
      )}
    </div>
  );
};
