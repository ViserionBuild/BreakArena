const INDIAN_TIME_ZONE = 'Asia/Kolkata';
const INDIAN_TIME_OFFSET = '+05:30';

const indianDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: INDIAN_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  hourCycle: 'h23',
});

const getIndianParts = (date = new Date()) => {
  const parts = indianDateTimeFormatter.formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;

  return {
    day: get('day'),
    month: get('month'),
    year: get('year'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
    millisecond: String(date.getMilliseconds()).padStart(3, '0'),
  };
};

const getIndianDateKey = (date = new Date()) => {
  const { year, month, day } = getIndianParts(date);
  return `${year}-${month}-${day}`;
};

const getIndianDbTimestamp = (date = new Date()) => {
  const { year, month, day, hour, minute, second, millisecond } = getIndianParts(date);
  return `${year}-${month}-${day} ${hour}:${minute}:${second}.${millisecond}`;
};

const getIndianTimestamp = (date = new Date()) =>
  `${getIndianDbTimestamp(date).replace(' ', 'T')}${INDIAN_TIME_OFFSET}`;

module.exports = {
  INDIAN_TIME_ZONE,
  INDIAN_TIME_OFFSET,
  getIndianDateKey,
  getIndianDbTimestamp,
  getIndianTimestamp,
};
