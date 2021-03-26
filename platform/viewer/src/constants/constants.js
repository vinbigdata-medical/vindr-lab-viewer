// common
export const TOKEN = 'token';
export const REFRESH_TOKEN = 'refresh_token';
export const FIRST_REFRESH_TOKEN = 'first_refresh_token';
export const CALLBACK_URL = 'callbackUrl';

export const BASE_ROUTER_PREFIX =
  process.env.MEDICAL_VIEW_URL_PREFIX || '/medical-view';
export const BASE_ROUTER_DASHBOARD_PREFIX =
  process.env.DASHBOARD_URL_PREFIX || '/dashboard';

export let CONFIG_SERVER = {
  TOKEN_PERMISSION: 'api#all',
  BASE_URL: process.env.SERVER_BASE_URL + '/api',
  AUTH_URL: process.env.SERVER_BASE_URL,
  LOGIN_CALLBACK_URI:
    process.env.OIDC_REDIRECT_MEDICAL_VIEW_URI ||
    window.origin + BASE_ROUTER_PREFIX,
  CLIENT_ID: process.env.OIDC_CLIENT_ID || 'vinlab-frontend',
  RESPONSE_TYPE: 'code',
  SCOPE: process.env.OIDC_SCOPE || 'profile',
  STATE: Math.random()
    .toString(36)
    .substring(2),
  AUDIENCE: process.env.OIDC_AUDIENCE || 'vinlab-backend',
  OIDC_ACCESS_TOKEN_URI: process.env.OIDC_ACCESS_TOKEN_URI,
  OIDC_AUTHORIZATION_URI: process.env.OIDC_AUTHORIZATION_URI,
  OIDC_LOGOUT_URI: process.env.OIDC_LOGOUT_URI,
  OIDC_USERINFO_ENDPOINT: process.env.OIDC_USERINFO_ENDPOINT,
  OIDC_REDIRECT_URI:
    process.env.OIDC_REDIRECT_URI ||
    window.origin + BASE_ROUTER_DASHBOARD_PREFIX, // redirect to Dashboard
};

export const LABEL_TYPE = {
  BOUNDING_BOX: 'BOUNDING_BOX',
  POLYGON: 'POLYGON',
  MASK: 'MASK',
};

export const MAP_TOOL_LABEL = {
  RectangleRoi: 'BOUNDING_BOX',
  FreehandRoi: 'POLYGON',
  Brush: 'MASK',
};

export const TOOL_TYPE = {
  BOUNDING_BOX: 'RectangleRoi',
  POLYGON: 'FreehandRoi',
  MASK: 'Brush',
};

export const TAB_NAMES = {
  TOOLS: 'Tools',
  SUMMARY: 'Summary',
};

export const LABELLING_ACTIONS = {
  UPDATE: 'UPDATE',
  CREATE: 'CREATE',
};

export const STUDY_STATUS = {
  NEW: 'NEW',
  ANNOTATING: 'ANNOTATING',
  REVIEWING: 'REVIEWING',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR',
};

export const TASK_STATUS = {
  NEW: 'NEW',
  DOING: 'DOING',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
};

export const ROLES = {
  REVIEWER: 'REVIEWER',
  PROJECT_OWNER: 'PROJECT_OWNER',
  ANNOTATOR: 'ANNOTATOR',
};

export const SCOPES = {
  STUDY: 'STUDY',
  SERIES: 'SERIES',
  IMAGE: 'IMAGE',
};

export const ANNOTATION_STATUS = {
  UPDATED: 'UPDATED',
  CREATED: 'CREATED',
  DELETED: 'DELETED',
};

export const PROJECT_TYPE = {
  TYPE_2D: '2D',
  TYPE_3D: '3D',
};

export const ANNOTATION_TOOLS = ['RectangleRoi', 'FreehandRoi', 'Brush'];

export const MAX_LOAD_CACHE_SERIES = 25;
export const MAX_LOAD_CACHE_IMAGE = 100;
