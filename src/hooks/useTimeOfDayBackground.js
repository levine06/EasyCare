// Shared morning/afternoon/night background image selection, used by every screen's
// ImageBackground so they all switch together as the day goes on.
export function useTimeOfDayBackground() {
  const hour = new Date().getHours();
  const isNight = hour >= 18;
  const isMorning = hour < 12;
  const isAfternoon = !isMorning && !isNight;
  // Afternoon and night both use a saturated, darker background — text on top of
  // either uses the same light/white treatment, unlike morning's pale sky.
  const useLightText = isNight || isAfternoon;

  let background;
  if (isMorning) {
    background = require('../../assets/morning.png');
  } else if (isAfternoon) {
    background = require('../../assets/afternoon.png');
  } else {
    background = require('../../assets/night.png');
  }

  return { background, isNight, isMorning, isAfternoon, useLightText, hour };
}
