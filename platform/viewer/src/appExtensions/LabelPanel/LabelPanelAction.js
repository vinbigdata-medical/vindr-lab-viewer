import get from 'lodash/get';
import api from '../../services/api';
import {
  actionSetExtensionData,
  actionGetStoreData,
  isTaskOwner,
} from '../../system/systemAction';

import { ROLES, TASK_STATUS } from '../../constants/constants';
import { disableTools, hasRole } from '../../utils/helpers';
import { setExtensionData } from '@ohif/core/src/redux/actions';
import { isEmpty } from '../../utils/helpers';
import { message } from 'antd';

export const actionGetLabels = async (params = {}) => {
  try {
    const { data } = await api({ url: '/labels', method: 'get', params });
    window.store.dispatch(actionSetExtensionData('label', data.data || {}));
  } catch (error) {
    console.log(error);
  }
};

export const actionGetTasks = (params = {}) => async dispatch => {
  try {
    const { data } = await api({
      url: '/tasks',
      method: 'get',
      params,
    });
    if (data) {
      const payload = {
        tasks: data.data,
      };
      dispatch(actionSetExtensionData('tasks', payload));
    }
  } catch (error) {
    console.log(error);
  }
};

export const actionGetTaskDetail = (
  params = {},
  successCallback
) => async dispatch => {
  try {
    const { id } = params;
    const { data } = await api({
      url: `/tasks/${id}`,
      method: 'get',
    });

    const currentTask = get(data, 'data');
    if (successCallback) {
      successCallback(currentTask);
    }
    if (currentTask) {
      const status = currentTask.status.toUpperCase();
      if (status === TASK_STATUS.NEW && isTaskOwner(currentTask)) {
        actionUpdateTaskStatus({
          id: currentTask.id,
          status: TASK_STATUS.DOING,
        });
      }
      const store = window.store.getState();
      if (
        status === TASK_STATUS.COMPLETED ||
        status === TASK_STATUS.ARCHIVED ||
        !isTaskOwner(currentTask)
      ) {
        disableTools();
      }

      const sessionState = get(store, 'extensions.session');
      if (sessionState) {
        dispatch(
          actionSetExtensionData(
            'session',
            { ...sessionState, currentTask: data.data } || {}
          )
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const actionUpdateTask = async (params = {}) => {
  try {
    const { id } = params;
    const { data } = await api({
      url: `tasks/${id}`,
      method: 'put',
      data: { comment: params.comment },
    });
    if (data) {
      window.store.dispatch(actionGetTaskDetail({ id }));
    }
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const actionSaveAnnotations = async (taskId, payloadData = {}) => {
  try {
    const { data } = await api({
      url: `tasks/${taskId}/annotations`,
      method: 'put',
      data: payloadData,
    });

    return data;
  } catch (error) {
    console.log(error);
    message.error('System error!');
  }
};

export const actionGetAnnotations = async (params = {}, currentTask = {}) => {
  try {
    let { creatorIds } = params;
    const store = window.store.getState();
    const extensions = get(store, 'extensions');
    const user = get(store, 'extensions.user');
    const studyId = get(store, 'extensions.session.currentStudy.id');

    if (!creatorIds) {
      creatorIds = [currentTask.assignee_id || user.sub];
      if (hasRole(ROLES.REVIEWER)) {
        window.store.dispatch(
          setExtensionData('reviewer', {
            annotators: creatorIds,
          })
        );
      }
      if (!currentTask.assignee_id && hasRole(ROLES.REVIEWER)) {
        const annotators = get(extensions, 'reviewer.annotators');
        if (!isEmpty(annotators)) {
          creatorIds = annotators;
        }
      }
    }

    const creatorIdsQuery = creatorIds
      .map(item => `creator_id.keyword:${item}`)
      .join(' OR ');
    try {
      const { data } = await api({
        url: `/annotations`,
        method: 'get',
        params: {
          _search: creatorIdsQuery,
          masked_study_instance_uid: studyId,
        },
      });

      const res = (data && data.data) || {};
      const annotation = {
        FINDING: res.FINDING || [],
        IMPRESSION: res.IMPRESSION || [],
      };

      if (data && data.error_code === 0) {
        window.store.dispatch(actionSetExtensionData('annotation', annotation));

        if (hasRole(ROLES.REVIEWER)) {
          window.store.dispatch(
            setExtensionData('reviewer', {
              annotators: creatorIds,
            })
          );
        }
      }

      return data.data;
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
};

export const actionGetProjectDetail = async params => {
  const { projectId } = params;
  const { data } = await api({ url: `/projects/${projectId}`, method: 'GET' });
  const session = get(window.store.getState(), 'extensions.session');

  if (data) {
    window.store.dispatch(
      actionSetExtensionData(
        'session',
        { ...session, projectDetail: data.data } || {}
      )
    );
  }
};

export const actionGetAssigneeWithStudy = async params => {
  const { StudyInstanceUID } = params;

  const url = `/stats/studies/${StudyInstanceUID}/assignee`;
  const { data } = await api({ url, method: 'GET' });

  if (data && data.data) {
    window.store.dispatch(
      actionSetExtensionData('session', {
        assigneesInCurrentStudy: data.data.assignees,
      })
    );
  }
};

export const actionAddImpression = (data, scope) => {
  const postData = {
    label_ids: [data.labelId],
    type: 'TAG',
    description: data.description || '',
    ...getMetaUIDs(scope),
  };

  if (data.SOPInstanceUID) {
    if (postData.meta) {
      postData.meta.masked_sop_instance_uid = data.SOPInstanceUID;
    } else {
      postData.meta = {
        masked_sop_instance_uid: data.SOPInstanceUID,
      };
    }
  }

  return api({ url: '/annotations', method: 'post', data: postData });
};

export const actionUpdateAnnotation = (id, data = {}) => {
  return api({ url: '/annotations/' + id, method: 'put', data });
};

// Change task status
export const actionUpdateTaskStatus = async (params = {}) => {
  const { id, status } = params;
  const res = await api({
    url: `tasks/${id}/status`,
    method: 'put',
    data: { status, id },
  });
  if (res) {
    window.store.dispatch(actionGetTaskDetail({ id }));
  }
  return res;
};

// Archive Task
export const updateTaskArchiveStatus = async params => {
  const { id, archived } = params;
  const postData = { archive: archived };
  const data = await api({
    url: `/tasks/${id}/archive`,
    method: 'PUT',
    data: postData,
  });

  const statusCode = get(data, 'status');
  if (statusCode == 200) {
    window.store.dispatch(actionGetTaskDetail({ id }));
  }
  return data;
};

export const actionSetSelectedLabel = (
  label = {},
  selectedLabel = {}
) => dispatch => {
  dispatch(
    actionSetExtensionData('label', { ...label, selectedLabel: selectedLabel })
  );
};

export const getCurrentSelectedLabel = () => {
  const { label } = actionGetStoreData('extensions') || {};
  return label.selectedLabel;
};

export const getMetaUIDs = scope => {
  const viewports = actionGetStoreData('viewports') || {};
  const extensions = actionGetStoreData('extensions');
  const currentTask = get(extensions, 'session.currentTask');
  const taskId = get(currentTask, 'id');
  const study_id = get(currentTask, 'study_id');
  const projectId = get(currentTask, 'project_id');
  const { activeViewportIndex = 0, viewportSpecificData = {} } = viewports;

  const activeViewport = viewportSpecificData[activeViewportIndex] || {};

  const UIDs = {
    project_id: projectId,
    task_id: taskId,
    study_id,

    meta: {
      masked_study_instance_uid: activeViewport.StudyInstanceUID,
      masked_series_instance_uid: activeViewport.SeriesInstanceUID,
      masked_sop_instance_uid: activeViewport.SOPInstanceUID || 'null',
    },
  };
  return UIDs;
};
