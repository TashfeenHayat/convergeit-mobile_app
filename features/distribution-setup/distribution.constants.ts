export const DISTRIBUTION_BASE_PATH = "/dashboard/distribution-setup";

export const DISTRIBUTION_ROUTES = {
  home: DISTRIBUTION_BASE_PATH,
  configure: `${DISTRIBUTION_BASE_PATH}/configure`,
  settings: `${DISTRIBUTION_BASE_PATH}/settings`,
  subject: `${DISTRIBUTION_BASE_PATH}/subject`,
  table: `${DISTRIBUTION_BASE_PATH}/table`,
  test: `${DISTRIBUTION_BASE_PATH}/test`,
  transcript: `${DISTRIBUTION_BASE_PATH}/transcript`,
} as const;
