import { eFleetsCapability, eFleetsConfigured } from "./efleets.js";
import { oneStepConfigured } from "./onestep.js";
import { sheetsConfigured } from "./sheets.js";

export function integrationStatus(env = process.env) {
  return {
    sheets: {
      configured: sheetsConfigured(env),
      api: "https://sheets.googleapis.com/v4",
      light: true,
    },
    onestep: {
      configured: oneStepConfigured(env),
      api: "https://track.onestepgps.com/v3/api/public",
      light: true,
    },
    efleets: {
      configured: eFleetsConfigured(),
      ...eFleetsCapability(),
      light: true,
    },
  };
}
