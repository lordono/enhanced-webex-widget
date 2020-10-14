import React, { useState, useContext, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import ReactTooltip from "react-tooltip";

import { MeetingContext } from "../../features/meeting/meetingStore";
import { Loading } from "../Loading/Loading";
import LoadingSvg from "../../img/ellipsis.svg";
import clsx from "clsx";
import { changeMode } from "../../features/widgetBase/widgetBaseSlice";
import {
  setAttribute,
  resetWidgetMeeting
} from "../../features/widgetMeeting/widgetMeetingSlice";
import { StoreContext } from "../../features/webex/webexStore";

export const BaseMeeting = () => {
  const dispatch = useDispatch();
  const [webex] = useContext(StoreContext);
  const { meetingStore, updateMeeting } = useContext(MeetingContext);

  const mode = useSelector(state => state.widgetBase.mode);
  const widgetMeeting = useSelector(state => state.widgetMeeting);
  const space = useSelector(
    state => state.spaces.entities[state.widgetMeeting.current.spaceId]
  );
  const { inMeeting, joiningMeeting, isMuted, isOnVideo } = widgetMeeting;
  // check if space is a hunting line
  // const huntingSpaces = useSelector(state => state.hunting.spaces);
  // const isHunting = space ? huntingSpaces.includes(space.id) : false;

  // references for video/audio html-markups
  const selfVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // states to hold video/audio streams
  const [selfView, setSelfView] = useState(null);
  const [remoteVideo, setRemoteVideo] = useState(null);
  const [remoteAudio, setRemoteAudio] = useState(null);
  // states to hold members and sidebar trigger to show members
  const [members, setMembers] = useState([]);
  const [sidebar, setSidebar] = useState(null);

  const currentUrl = widgetMeeting.current.spaceUrl;
  const currentMeeting = meetingStore[currentUrl];
  const currentCreating = widgetMeeting.current.creating;

  // control button classes 
  const onAudioBtn = clsx("video-controls-btn", isMuted && "negative");
  const onVideoBtn = clsx("video-controls-btn", !isOnVideo && "negative");
  const onPeopleBtn = clsx(
    "video-controls-btn",
    sidebar === "people" && "selected"
  );

  // container classes
  const containerClass = clsx(
    "app-content-meeting",
    mode === "meeting" && "show"
  );
  const sidebarCss = clsx(
    "sidebar-participants",
    sidebar === "people" && "show"
  );
  // format space name
  const spaceName = space
    ? `${space.isOneOnOne ? "1 on 1: " : ""}${space.displayName}`
    : "";

  // binding functions
  const onError = err => console.log(err);
  const onMediaReady = media => {
    if (!media) {
      return;
    }
    if (media.type === "local") setSelfView(media.stream);
    if (media.type === "remoteVideo") setRemoteVideo(media.stream);
    if (media.type === "remoteAudio") setRemoteAudio(media.stream);
  };
  const onMediaStopped = media => {
    // Remove media streams
    if (media.type === "local") setSelfView(null);
    if (media.type === "remoteVideo") setRemoteVideo(null);
    if (media.type === "remoteAudio") setRemoteAudio(null);
  };
  const onMembersUpdate = delta => {
    const { full: membersData } = delta;
    const memberIDs = Object.keys(membersData);
    const memberList = [];

    memberIDs.forEach(memberID => {
      const memberObject = membersData[memberID];
      // Devices are listed in the memberships object.
      // We are not concerned with them in this demo
      if (memberObject.isUser) memberList.push(memberObject);
    });
    setMembers(memberList);
  };

  // Similarly, there are a few different ways we'll get a meeting Object, so let's
  // put meeting handling inside its own function.
  const bindMeetingEvents = meeting => {
    // naive handling of error
    meeting.on("error", onError);

    // Handle media streams changes to ready state
    meeting.on("media:ready", onMediaReady);

    // Handle media streams stopping
    meeting.on("media:stopped", onMediaStopped);

    // Update participant info
    meeting.members.on("members:update", onMembersUpdate);
  };

  const unBindMeetingEvents = meeting => {
    console.log("unbinding events");
    // naive handling of error
    meeting.off("error", onError);

    // Handle media streams changes to ready state
    meeting.off("media:ready", onMediaReady);

    // Handle media streams stopping
    meeting.off("media:stopped", onMediaStopped);

    // Update participant info
    meeting.members.off("members:update", onMembersUpdate);
    console.log("unbinding events complete");
  };

  // join Meeting
  const joinMeeting = meeting => {
    dispatch(setAttribute({ attr: "joiningMeeting", value: true }));
    bindMeetingEvents(meeting);
    dispatch(setAttribute({ attr: "isEventBinded", value: true }));

    return meeting.join().then(() => {
      dispatch(setAttribute({ attr: "joiningMeeting", value: false }));
      const mediaSettings = {
        receiveVideo: true,
        receiveAudio: true,
        receiveShare: true,
        sendVideo: true,
        sendAudio: true,
        sendShare: false
      };

      return meeting.getMediaStreams(mediaSettings).then(mediaStreams => {
        const [localStream, localShare] = mediaStreams;

        meeting.addMedia({
          localShare,
          localStream,
          mediaSettings
        });
      });
    });
  };

  // effects to send any incoming streams to html references
  useEffect(() => {
    if (selfVideoRef.current) selfVideoRef.current.srcObject = selfView;
  }, [selfView]);
  useEffect(() => {
    console.log('remoteVideo', remoteVideo, remoteVideoRef.current);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteVideo;
  }, [remoteVideo]);
  useEffect(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteAudio;
  }, [remoteAudio]);

  // render view
  if (!widgetMeeting.current.spaceId) {
    // no meeting selected
    return (
      <div className={containerClass}>
        <Loading img={LoadingSvg} text="No Space selected" />
      </div>
    );
  } else if (joiningMeeting) {
    // loading screen for joining meeting
    return (
      <div className={containerClass}>
        <Loading img={LoadingSvg} text="Joining the meeting..." />
      </div>
    );
  } else if (currentCreating) {
    // loading screen for starting meeting
    return (
      <div className={containerClass}>
        <Loading img={LoadingSvg} text="Starting the meeting..." />
      </div>
    );
  } else if (!inMeeting && currentMeeting) {
    // startup screen for user to join meeting
    return (
      <div className={containerClass}>
        <div className="join-meeting-container">
          <div className="join-meeting-title">{spaceName}</div>
          <div
            className="join-meeting-btn"
            onClick={() => {
              joinMeeting(currentMeeting.meeting);
              dispatch(setAttribute({ attr: "inMeeting", value: true }));
            }}
          >
            <ion-icon class="join-meeting-icon" name="today" />
            <span className="join-meeting-text">Join Meeting</span>
          </div>
        </div>
      </div>
    );
  } else if (!inMeeting && !currentMeeting) {
    // startup screen for user to start meeting
    return (
      <div className={containerClass}>
        <div className="join-meeting-container">
          <div className="join-meeting-title">{spaceName}</div>
          <div
            className="join-meeting-btn"
            onClick={() => {
              webex.meetings.create(currentUrl).then(meeting => {
                updateMeeting(currentUrl, { type: "JOIN", meeting });
                joinMeeting(meeting);
                dispatch(setAttribute({ attr: "inMeeting", value: true }));
              });
            }}
          >
            <ion-icon class="join-meeting-icon" name="today" />
            <span className="join-meeting-text">Start Meeting</span>
          </div>
        </div>
      </div>
    );
  } else {
    // video-call default screen
    return (
      <div className={containerClass}>
        <div className="app-meeting-main">
          <div className="video-container">
            <video
              ref={selfVideoRef}
              className="video-self"
              muted
              autoPlay
              playsInline
            />
            <audio
              ref={remoteAudioRef}
              className="audio-remote"
              autoPlay
              playsInline
            />
            <video
              ref={remoteVideoRef}
              className="video-remote"
              autoPlay
              playsInline
            />
          </div>
          <div className="video-controls">
            <div
              className={onAudioBtn}
              onClick={() => {
                if (isMuted) {
                  currentMeeting.meeting
                    .unmuteAudio()
                    .then(() =>
                      dispatch(setAttribute({ attr: "isMuted", value: false }))
                    );
                } else {
                  currentMeeting.meeting
                    .muteAudio()
                    .then(() =>
                      dispatch(setAttribute({ attr: "isMuted", value: true }))
                    );
                }
              }}
            >
              <ion-icon class="video-btn-icon" name="mic-off" />
            </div>
            <div
              className={onVideoBtn}
              onClick={() => {
                if (isOnVideo) {
                  currentMeeting.meeting
                    .muteVideo()
                    .then(() =>
                      dispatch(
                        setAttribute({ attr: "isOnVideo", value: false })
                      )
                    );
                } else {
                  currentMeeting.meeting
                    .unmuteVideo()
                    .then(() =>
                      dispatch(setAttribute({ attr: "isOnVideo", value: true }))
                    );
                }
              }}
            >
              <ion-icon class="video-btn-icon" name="eye-off" />
            </div>
            <div
              className={onPeopleBtn}
              onClick={() => {
                if (sidebar === "people") setSidebar(null);
                else setSidebar("people");
              }}
            >
              <ion-icon class="video-btn-icon" name="people" />
            </div>
            <div
              className="video-controls-btn negative"
              onClick={() => {
                dispatch(changeMode("message"));
                currentMeeting.meeting.leave().then(() => {
                  unBindMeetingEvents(currentMeeting.meeting);
                  dispatch(resetWidgetMeeting());
                });
                // if (isHunting) {
                //   webex.meetings.destroy(currentMeeting.meeting, 'FULLSTATE_REMOVED');
                //   unBindMeetingEvents(currentMeeting.meeting);
                //   dispatch(resetWidgetMeeting());
                // } else {
                //   currentMeeting.meeting.leave().then(() => {
                //     unBindMeetingEvents(currentMeeting.meeting);
                //     dispatch(resetWidgetMeeting());
                //   });
                // }
              }}
            >
              <ion-icon class="video-btn-icon" name="exit" />
            </div>
          </div>
          <div className={sidebarCss}>
            <div className="sidebar-title">In Meeting</div>
            {members
              .filter(i => i.status === "IN_MEETING")
              .map(i => (
                <div key={i.id}>
                  <div className="sidebar-member" data-tip data-for={i.id}>
                    {i.participant.person.name}
                  </div>
                  <ReactTooltip id={i.id} effect="solid">
                    <span>{i.participant.person.email}</span>
                  </ReactTooltip>
                </div>
              ))}
            <div className="sidebar-title">Not In Meeting</div>
            {members
              .filter(i => i.status !== "IN_MEETING")
              .map(i => (
                <div key={i.id}>
                  <div className="sidebar-member" data-tip data-for={i.id}>
                    {i.participant.person.name}
                  </div>
                  <ReactTooltip id={i.id} effect="solid">
                    <span>{i.participant.person.email}</span>
                  </ReactTooltip>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }
};
