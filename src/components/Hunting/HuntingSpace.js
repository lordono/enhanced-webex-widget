import React from "react";
import { useSelector } from "react-redux";

import { selectUsersByIds } from "../../features/users/usersSlice";

export const HuntingSpace = ({ space }) => {
  const participants = useSelector(state =>
    selectUsersByIds(state, space.participants)
  );

  return (
    <>
      <div className="msg-header">
        <div className="msg-header-main">
          <div className="msg-header-toolkit">
            <ion-icon name="chatbubble-ellipses" />
          </div>
          <div className="msg-header-title">{space.displayName}</div>
        </div>
      </div>
      <div className="space-form">
        <div className="space-main">
          <div className="space-main-form">
            <div className="space-input-group">
              <div className="space-input-label">Space Name</div>
              <input
                type="text"
                className="space-input"
                placeholder="Space Name"
                value={space.displayName}
                readOnly
              />
            </div>
            <div className="space-input-group">
              <div className="space-input-label">Participants</div>
              <div className="space-input-list">
                {participants.map(i => (
                  <div key={i.id} className="space-input-li">
                    <div className="space-input-main">
                      <div className="space-input-title">{i.displayName}</div>
                      <div className="space-input-desc">{i.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
