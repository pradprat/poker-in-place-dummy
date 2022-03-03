export const getMeetingLink = (meetingUrl: string) => {
  // "/meeting/99164114419/cUNwMVpCSExlaTgweStqaHBBcWtndz09"
  // https://zoom.us/j/99164114419?pwd=cUNwMVpCSExlaTgweStqaHBBcWtndz09
  const lastPart = meetingUrl.substring(
    meetingUrl.lastIndexOf("/") + 1,
    meetingUrl.length
  );
  const meetingParts = lastPart.split("?");
  if (meetingParts.length < 2) {
    alert(
      "Invalid Zoom link. Should be of the form: https://zoom.us/j/{meetingId}?pwd={encryptedPassword}"
    );
    return;
  }
  const meetingNumber = meetingParts[0];
  const pwd = meetingParts[1].substring(
    meetingParts[1].indexOf("=") + 1,
    meetingParts[1].length
  );
  return `/meeting/${meetingNumber}/${pwd}`;
};