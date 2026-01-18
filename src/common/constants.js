export const SONOS_STEPS = 20;
export const STORM_VOLUME = 10;
export const ERUPTION_VOLUME = 15;
export const MIN_EVENT_INTERVAL_MINUTES = 30;
export const MAX_EVENT_INTERVAL_MINUTES = 90;

export const EVENT_TYPES = {
  STORM: {
    startLog: "🌩️ Storm summoned",
    errorLog: "Storm error",
    endLog: "🌴 Storm ended",
    uri: "http://pauhana-pi.local:9001/audio/thunderstorm.mp3",
  },
  ERUPTION: {
    startLog: "🌋 The volcano is erupting!",
    errorLog: "Eruption error",
    endLog: "🌴 Eruption ended",
    uri: "http://pauhana-pi.local:9001/audio/eruption.mp3",
  },
};
