// constants used for identifying events for meetings
import { CONSTANTS } from "@webex/plugin-meetings";

/**
 * handles locus events through mercury that are not roap
 * @param {Object} envelope
 * @param {Object} envelope.data
 * @param {String} envelope.data.eventType
 * @returns {undefined}
 * @private
 * @memberof Meetings
 */
export const handleLocusMercury = envelope => {
  const { data } = envelope;
  const { eventType } = data;

  if (eventType && eventType !== CONSTANTS.LOCUSEVENT.MESSAGE_ROAP) {
    handleLocusEvent(data);
  }
};

/**
 * handle locus events and takes meeting actions with them as they come in
 * @param {Object} data a locus event
 * @param {String} data.locusUrl
 * @param {Object} data.locus
 * @param {String} data.eventType
 * @returns {undefined}
 * @private
 * @memberof Meetings
 */
const handleLocusEvent = data => {
  let meeting = null;

  // getting meeting by correlationId. This will happen for the new event
  // Either the locus
  // TODO : Add check for the callBack Address
  meeting =
    this.meetingCollection.getByKey(CONSTANTS.LOCUS_URL, data.locusUrl) ||
    this.meetingCollection.getByKey(
      CORRELATION_ID,
      MeetingsUtil.checkForCorrelationId(
        this.webex.internal.device.url,
        data.locus
      )
    ) ||
    this.meetingCollection.getByKey(
      SIP_URI,
      data.locus.self &&
        data.locus.self.callbackInfo &&
        data.locus.self.callbackInfo.callbackAddress
    );

  if (!meeting) {
    // TODO: create meeting when we get a meeting object
    // const checkForEnded = (locus) => {
    // TODO: you already ended the meeting but you got an event later
    // Mainly for 1:1 Callsor meeting
    // Happens mainly after refresh

    // 1:1 Meeting
    // 1)  You ended a call before but you got a mercury event
    // Make sure end the call and cleanup the meeting only if the mercury
    // event says so
    // 2) Maintain lastSync time in the meetings object which helps to compare
    // If the meeting came befor or after the sync . ANy meeting start time before the sync time is invalid

    // For space Meeting
    // Check the locus object and see who has joined

    // };
    // rather then locus object change to locus url

    if (
      data.locus &&
      data.locus.fullState &&
      data.locus.fullState.state === LOCUS.STATE.INACTIVE
    ) {
      // just ignore the event as its already ended and not active
      LoggerProxy.logger.warn(
        "Meetings:index#handleLocusEvent --> Locus event received for meeting, after it was ended."
      );

      return;
    }

    // When its wireless share or guest and user leaves the meeting we dont have to keep the meeting object
    // Any future events will be neglected

    if (
      data.locus &&
      data.locus.self &&
      data.locus.self.state === _LEFT_ &&
      data.locus.self.removed === true
    ) {
      // just ignore the event as its already ended and not active
      LoggerProxy.logger.warn(
        "Meetings:index#handleLocusEvent --> Locus event received for meeting, after it was ended."
      );

      return;
    }

    this.create(data.locus, _LOCUS_ID_)
      .then(newMeeting => {
        meeting = newMeeting;

        if (data.eventType === LOCUSEVENT.DIFFERENCE) {
          // its a delta object and we have a new meeting
          meeting.locusInfo.initialSetup(data.locus, meeting);
        } else {
          // Its a new meeting and have a fresh locus object
          meeting.locusInfo.initialSetup(data.locus);
        }
      })
      .finally(() => {
        // There will be cases where locus event comes in gets created and deleted because its a 1:1 and meeting gets deleted
        // because the other user left so before sending 'added' event make sure it exists in the collection

        if (this.getMeetingByType(_ID_, meeting.id)) {
          // Had to put `meeting:added here as the parsing of the locus object is done here
          Metrics.postEvent({
            event: eventType.NOTIFICATION_RECEIVED,
            meeting,
            data: { trigger: trigger.MERCURY_EVENT }
          });

          Metrics.postEvent({
            event: eventType.REMOTE_STARTED,
            meeting,
            data: { trigger: trigger.MERCURY_EVENT }
          });
          Trigger.trigger(
            this,
            {
              file: "meetings",
              function: "handleLocusEvent"
            },
            EVENT_TRIGGERS.MEETING_ADDED,
            {
              meeting,
              type: meeting.type === _MEETING_ ? _JOIN_ : _INCOMING_
            }
          );
        } else {
          // Meeting got added but was not found in the collection. It might have got destroyed
          LoggerProxy.logger.warn(
            "Meetings:index#handleLocusEvent --> Created and destroyed meeting object before sending an event"
          );
        }
      });
  } else {
    Metrics.postEvent({
      event: eventType.NOTIFICATION_RECEIVED,
      meeting,
      data: { trigger: trigger.MERCURY_EVENT }
    });
    meeting.locusInfo.parse(meeting, data);
  }
};
