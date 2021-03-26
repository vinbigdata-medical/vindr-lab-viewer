import cookie from 'js-cookie';
import api from '../services/api';
import { redux } from '@ohif/core';
import store from '../store';
import {
  CONFIG_SERVER,
  CALLBACK_URL,
  BASE_ROUTER_PREFIX,
  BASE_ROUTER_DASHBOARD_PREFIX,
  TOKEN,
  REFRESH_TOKEN,
  FIRST_REFRESH_TOKEN,
  TASK_STATUS,
} from '../constants/constants';
import get from 'lodash/get';
import { actionSaveAnnotations } from '../appExtensions/LabelPanel/LabelPanelAction';
import { message } from 'antd';

const {
  CLIENT_ID,
  LOGIN_CALLBACK_URI,
  OIDC_ACCESS_TOKEN_URI,
  AUTH_URL,
  OIDC_USERINFO_ENDPOINT,
  OIDC_AUTHORIZATION_URI,
  RESPONSE_TYPE,
  STATE,
  OIDC_LOGOUT_URI,
  OIDC_REDIRECT_URI,
  SCOPE,
  AUDIENCE,
  TOKEN_PERMISSION,
} = CONFIG_SERVER;

export const actionSetExtensionData = (key, data) => dispatch => {
  dispatch(redux.actions.setExtensionData(key, data));
};

export const actionGetStoreData = key => {
  const data = store.getState() || {};
  return (key && data[key]) || data;
};

export const actionGetSession = (sessionId = '') => async dispatch => {
  try {
    const { data } = await api({
      url: '/sessions/' + sessionId,
      method: 'get',
    });
    if (data && data.count > 0) {
      dispatch(
        actionSetExtensionData(
          'session',
          { ...data, studyIndex: 0, currentStudy: data.data[0] } || {}
        )
      );
    }
  } catch (error) {
    console.log(error);
  }
};

export const getAccountInfo = () => async dispatch => {
  try {
    const { data } = await api({
      method: 'get',
      url:
        OIDC_USERINFO_ENDPOINT ||
        AUTH_URL + '/auth/realms/vinlab/protocol/openid-connect/userinfo',
    });

    dispatch(actionSetExtensionData('user', data || {}));

    if (
      sessionStorage.getItem(CALLBACK_URL) &&
      window.location.pathname.indexOf(BASE_ROUTER_DASHBOARD_PREFIX) === -1
    ) {
      const { pathname, search = '' } = JSON.parse(
        sessionStorage.getItem(CALLBACK_URL)
      );
      sessionStorage.removeItem(CALLBACK_URL);

      if (pathname.indexOf(BASE_ROUTER_PREFIX + '/viewer/') === -1) {
        window.location.replace(BASE_ROUTER_DASHBOARD_PREFIX);
      } else {
        window.location.replace(pathname + search);
      }
    }
  } catch (error) {
    console.log(error);
    // Redirect to Dashboard
    if (window.location.pathname.indexOf(BASE_ROUTER_DASHBOARD_PREFIX) === -1) {
      window.location.replace(BASE_ROUTER_DASHBOARD_PREFIX);
    }
  }
};

export const getUser = userId => {
  return api({ url: '/accounts/userinfo/' + userId, method: 'get' });
};

export const actionGetToken = (code = '') => {
  let requestBody = new URLSearchParams();
  requestBody.append('grant_type', 'authorization_code');
  requestBody.append('client_id', CLIENT_ID);
  requestBody.append('code', code);
  requestBody.append('redirect_uri', LOGIN_CALLBACK_URI);

  return api({
    method: 'post',
    url:
      OIDC_ACCESS_TOKEN_URI ||
      AUTH_URL + '/auth/realms/vinlab/protocol/openid-connect/token',
    data: requestBody,
  });
};

export const actionGetPermissionToken = (token, listPermission) => {
  let requestBody = new URLSearchParams();
  requestBody.append(
    'grant_type',
    'urn:ietf:params:oauth:grant-type:uma-ticket'
  );
  requestBody.append('audience', AUDIENCE);
  (listPermission || TOKEN_PERMISSION).forEach(it => {
    requestBody.append('permission', it);
  });

  return api({
    method: 'post',
    url:
      OIDC_ACCESS_TOKEN_URI ||
      AUTH_URL + '/auth/realms/vinlab/protocol/openid-connect/token',
    data: requestBody,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const actionGetListPermission = (token = '') => {
  return api({
    method: 'get',
    url: '/accounts/permissions',
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const actionRefreshToken = (refreshToken = '') => {
  let requestBody = new URLSearchParams();
  requestBody.append('grant_type', 'refresh_token');
  requestBody.append('client_id', CLIENT_ID);
  requestBody.append('refresh_token', refreshToken);
  requestBody.append('redirect_uri', LOGIN_CALLBACK_URI);

  return api({
    method: 'post',
    url:
      OIDC_ACCESS_TOKEN_URI ||
      AUTH_URL + '/auth/realms/vinlab/protocol/openid-connect/token',
    data: requestBody,
  });
};

export const requestLogin = backToDashboard => {
  const pathAuth =
    OIDC_AUTHORIZATION_URI ||
    AUTH_URL + '/auth/realms/vinlab/protocol/openid-connect/auth';

  let loginUrl =
    pathAuth +
    '?client_id=' +
    CLIENT_ID +
    '&response_type=' +
    RESPONSE_TYPE +
    '&state=' +
    STATE +
    '&scope=' +
    SCOPE;

  if (backToDashboard) {
    // redirect to dashboard
    loginUrl += '&redirect_uri=' + OIDC_REDIRECT_URI;
  } else {
    loginUrl += '&redirect_uri=' + LOGIN_CALLBACK_URI;
    try {
      const { pathname, search } = window.location;
      sessionStorage.setItem(
        CALLBACK_URL,
        JSON.stringify({ pathname, search })
      );
    } catch (error) {
      console.log(error);
    }
  }

  window.location.href = encodeURI(loginUrl);
};

export const actionLogout = async (backToDashboard = true) => {
  try {
    if (cookie.get(REFRESH_TOKEN) || cookie.get(FIRST_REFRESH_TOKEN)) {
      let requestBody = new URLSearchParams();
      requestBody.append('client_id', CLIENT_ID);
      requestBody.append('redirect_uri', LOGIN_CALLBACK_URI);
      requestBody.append(
        'refresh_token',
        cookie.get(REFRESH_TOKEN) || cookie.get(FIRST_REFRESH_TOKEN)
      );
      await api({
        method: 'post',
        url:
          OIDC_LOGOUT_URI ||
          AUTH_URL + '/auth/realms/vinlab/protocol/openid-connect/logout',
        data: requestBody,
      });
    }
    cookie.remove(TOKEN);
    cookie.remove(REFRESH_TOKEN);
    cookie.remove(FIRST_REFRESH_TOKEN);
    requestLogin(backToDashboard);
  } catch (error) {
    cookie.remove(TOKEN);
    cookie.remove(REFRESH_TOKEN);
    cookie.remove(FIRST_REFRESH_TOKEN);
    requestLogin(backToDashboard);
  }
};

export const toggleSystemLoading = (isShow = false) => {
  window.store.dispatch(actionSetExtensionData('system', { loading: isShow }));
};

export const clearAnnotations = () => {
  window.store.dispatch(
    actionSetExtensionData('annotation', {
      FINDING: [],
      IMPRESSION: [],
    })
  );
};

export const saveAllAnnotations = async (isClearData, successCallback) => {
  try {
    const store = window.store.getState();
    const extensions = get(store, 'extensions');
    const FINDING = get(extensions, 'annotation.FINDING') || [];
    const IMPRESSION = get(extensions, 'annotation.IMPRESSION') || [];

    const allAnnotations = [...FINDING, ...IMPRESSION].map(item => {
      delete item.measurementNumber;
      delete item._id;
      delete item.locationLabel;
      return item;
    });

    const currentTask = get(extensions, 'session.currentTask');
    if (
      !currentTask ||
      !isTaskOwner(currentTask) ||
      currentTask.status === TASK_STATUS.COMPLETED
    ) {
      if (isClearData) {
        clearAnnotations();
      }
      if (successCallback) {
        successCallback();
      }
      return;
    }

    toggleSystemLoading(true);
    const data = await actionSaveAnnotations(currentTask.id, {
      annotations: allAnnotations,
      comment: currentTask.comment,
    });

    toggleSystemLoading(false);
    if (data && data.error_code === 0) {
      if (isClearData) {
        clearAnnotations();
      }
      if (successCallback) {
        successCallback(data);
      }
      message.success('Changes has been saved successfully');
      return data;
    }
  } catch (error) {
    console.log(error);
    toggleSystemLoading(false);
  }
};

export const isTaskOwner = currentTask => {
  const store = window.store.getState();
  const user = get(store, 'extensions.user') || {};
  const taskInfo = currentTask || get(store, 'extensions.session.currentTask');
  if (!taskInfo || !user) return false;
  return user.sub === taskInfo.assignee_id;
};

export const actionSetSelectedTool = activeButtons => dispatch => {
  dispatch(
    actionSetExtensionData('toolbar', { activeButtons: activeButtons || [] })
  );
};
