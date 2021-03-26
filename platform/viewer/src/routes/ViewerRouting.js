import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { utils, user } from '@ohif/core';
import { connect } from 'react-redux';
//
import ConnectedViewerRetrieveStudyData from '../connectedComponents/ConnectedViewerRetrieveStudyData';
import useServer from '../customHooks/useServer';
import useQuery from '../customHooks/useQuery';
import { actionGetSession } from '../system/systemAction';
import { isEmpty } from '../utils/helpers';
const { urlUtil: UrlUtil } = utils;

/**
 * Get array of seriesUIDs from param or from queryString
 * @param {*} seriesInstanceUIDs
 * @param {*} location
 */
const getSeriesInstanceUIDs = (seriesInstanceUIDs, routeLocation) => {
  const queryFilters = UrlUtil.queryString.getQueryFilters(routeLocation);
  const querySeriesUIDs = queryFilters && queryFilters['seriesInstanceUID'];
  const _seriesInstanceUIDs = seriesInstanceUIDs || querySeriesUIDs;

  return UrlUtil.paramString.parseParam(_seriesInstanceUIDs);
};

function ViewerRouting({
  match: routeMatch,
  location: routeLocation,
  session,
  useInfo,
  actionGetSession,
}) {
  const {
    project,
    location,
    dataset,
    dicomStore,
    sessionId,
    seriesInstanceUIDs,
  } = routeMatch.params;

  useEffect(() => {
    if (!isEmpty(useInfo) && sessionId) {
      actionGetSession(sessionId);
    }
    // eslint-disable-next-line
  }, [sessionId, useInfo]);

  // Set the user's default authToken for outbound DICOMWeb requests.
  // Is only applied if target server does not set `requestOptions` property.
  //
  // See: `getAuthorizationHeaders.js`
  let query = useQuery();
  const authToken = query.get('token');

  if (authToken) {
    user.getAccessToken = () => authToken;
  }

  const server = useServer({ project, location, dataset, dicomStore });
  // const studyUIDs = UrlUtil.paramString.parseParam(studyInstanceUIDs);

  const seriesUIDs = getSeriesInstanceUIDs(seriesInstanceUIDs, routeLocation);

  const { currentStudy = {}, data = [] } = session;
  const currentStudyUID = useMemo(() => {
    if (!isEmpty(currentStudy)) {
      return [currentStudy.id];
    } else {
      return [];
    }
  }, [currentStudy]);

  const listStudyUIDs = useMemo(() => {
    return data.map(it => it.id);
  }, [data]);

  if (server && (currentStudyUID || []).length > 0) {
    return (
      <ConnectedViewerRetrieveStudyData
        studyInstanceUIDs={currentStudyUID}
        seriesInstanceUIDs={seriesUIDs}
        listStudyUIDs={listStudyUIDs || []}
      />
    );
  }

  return null;
}

ViewerRouting.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      sessionId: PropTypes.string.isRequired,
      seriesInstanceUIDs: PropTypes.string,
      dataset: PropTypes.string,
      dicomStore: PropTypes.string,
      location: PropTypes.string,
      project: PropTypes.string,
    }),
  }),
  location: PropTypes.any,
};

export default connect(
  state => ({
    session: state.extensions.session,
    useInfo: state.extensions.user,
  }),
  { actionGetSession }
)(ViewerRouting);
