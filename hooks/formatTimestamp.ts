/**
 * Formats a timestamp in milliseconds to a human-readable format
 * 
 * @param ms Timestamp in milliseconds
 * @param referenceTime Optional reference time to calculate actual timestamp
 * @returns Formatted timestamp string
 */
export const formatTimestamp = (ms: number, referenceTime?: string): string => {
  if (ms === undefined || ms === null) return "";
  
  // If we have a reference time, use it to calculate the actual timestamp
  if (referenceTime) {
    try {
      const baseTime = new Date(referenceTime).getTime();
      const actualTime = new Date(baseTime + ms);
      return actualTime.toLocaleTimeString([], {
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
      });
    } catch (e) {
      // In case of error, fall back to minutes:seconds format
    }
  }
  
  // Format as minutes:seconds
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};