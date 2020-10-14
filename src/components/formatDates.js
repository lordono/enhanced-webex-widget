import { parseISO, format, differenceInCalendarDays } from "date-fns";

export const formatDate = givenDate => {
  let targetDate = givenDate;
  if (!(givenDate instanceof Date)) targetDate = parseISO(targetDate);
  const formatDay = format(targetDate, "EEEE");
  const formatDate = format(targetDate, "dd/MM/yy");
  const numOfDays = differenceInCalendarDays(new Date(), targetDate);

  if (numOfDays === 0) return "Today";
  else if (numOfDays === 1) return "Yesterday";
  else if (numOfDays < 7) return formatDay;
  else return formatDate;
};

export const formatMsgTime = stringDate => {
  const targetDate = parseISO(stringDate);
  const formattedTime = format(targetDate, "h:mm a");
  const formattedDate = formatDate(stringDate);
  if (formattedDate === "Today") return `${formattedTime}`;
  else return `${formattedDate} at ${formattedTime}`;
};
