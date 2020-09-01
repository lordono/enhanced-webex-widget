import React from "react";
import PropTypes from "prop-types";
import "./at-mention.css";

const propTypes = {
  content: PropTypes.string
};

const defaultProps = {
  content: ""
};

function AtMentionComponent({ content }) {
  return (
    <div
      className="atMention"
      // eslint-disable-reason content is generated from elsewhere in the app
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: content }}
      role="presentation"
    />
  );
}

AtMentionComponent.propTypes = propTypes;
AtMentionComponent.defaultProps = defaultProps;

export default activity => {
  if (activity.mentions) {
    const component = (
      <AtMentionComponent
        content={activity.content}
        mentions={activity.mentions.items}
      />
    );

    return Object.assign({}, activity, { component });
  }

  return activity;
};
