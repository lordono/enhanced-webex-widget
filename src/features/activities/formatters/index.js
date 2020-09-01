import linkify from "./linkify";
import atMention from "./at-mention";

export default activity => {
  const formatters = [linkify, atMention];
  let result = activity;

  formatters.forEach(formatter => {
    result = formatter(result);
  });

  return result;
};
