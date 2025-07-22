export const formatTimestamp = (ms: number, referenceTime?: string): string => {
  if (ms === undefined || ms === null) return "";

  if (referenceTime) {
    try {
      const baseTime = new Date(referenceTime).getTime();
      const actualTime = new Date(baseTime + ms);
      return actualTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {}
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};
