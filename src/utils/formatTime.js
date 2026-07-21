export const formatWeatherTime = (isoString, offsetSeconds = 0) => {
    if (!isoString) return '--:--';

    // format date string
    const utcString = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
    const baseUtcDate = new Date(utcString);

    // adding offset seconds (GMT) value to get local time
    const localTimestampMs = baseUtcDate.getTime() + (offsetSeconds * 1000);
    const correctedLocalDate = new Date(localTimestampMs);

    // time options
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
    };

    let formattedTime = new Intl.DateTimeFormat('en-IN', options).format(correctedLocalDate);
    return formattedTime.toUpperCase();
};
