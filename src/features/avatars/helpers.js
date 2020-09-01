export function convertToSmallAvatar(avatarUrl) {
  const sizeRegEx = /~\d+$/;

  if (sizeRegEx.test(avatarUrl)) {
    return avatarUrl.replace(sizeRegEx, "~110");
  }

  return avatarUrl;
}
