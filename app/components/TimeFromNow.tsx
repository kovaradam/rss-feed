import { Tooltip } from './Tooltip';

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

export function TimeFromNow(props: Props): JSX.Element {
  const difference = getTimeDifference(new Date(), props.date);

  const entries = [
    [difference.years, 'year'],
    [difference.months, 'month'],
    [difference.weeks, 'week'],
    [difference.days, 'day'],
    [difference.hours, 'hour'],
    [difference.minutes, 'minute'],
  ] as const;

  for (let i = 0; i < entries.length; i++) {
    const [value, label] = entries[i];
    if (value >= 1) {
      return (
        <span className={'relative'}>
          {`${value.toFixed()} ${label}${value > 1 ? 's' : ''} ago`}
          <Tooltip>{props.date.toLocaleDateString()}</Tooltip>
        </span>
      );
    }
  }

  return (
    <span className={'relative'}>
      {`${Math.max(Math.ceil(difference.seconds), 0)} second${
        difference.seconds > 1 ? 's' : ''
      } ago`}
      <Tooltip>{props.date.toLocaleDateString()}</Tooltip>
    </span>
  );
}
