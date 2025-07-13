import { Tooltip } from "./Tooltip";

function getTimeDifference(firstDate: Date, secondDate: Date) {
  const differenceInMillis = firstDate.getTime() - secondDate.getTime();

  const seconds = differenceInMillis / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const weeks = days / 7;
  const months = days / 31;
  const years = days / 362;

  return { days, weeks, months, years, seconds, minutes, hours };
}

type Props = { date: Date };

export function TimeFromNow(props: Props) {
  const difference = getTimeDifference(new Date(), props.date);

  const entries = [
    [difference.years, "year"],
    [difference.months, "month"],
    [difference.weeks, "week"],
    [difference.days, "day"],
    [difference.hours, "hour"],
    [difference.minutes, "minute"],
  ] as const;

  const tooltip = (
    <Tooltip>
      {props.date.toLocaleDateString("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
      })}
    </Tooltip>
  );

  for (const entry of entries) {
    const [value, label] = entry;
    if (value >= 1) {
      const floored = Math.floor(value);
      return (
        <span className={"relative"}>
          {`${floored.toFixed()} ${label}${floored > 1 ? "s" : ""} ago`}
          {tooltip}
        </span>
      );
    }
  }

  return (
    <span className={"relative"}>
      {`${Math.max(Math.ceil(difference.seconds), 0)} second${
        difference.seconds > 1 ? "s" : ""
      } ago`}
      {tooltip}
    </span>
  );
}
