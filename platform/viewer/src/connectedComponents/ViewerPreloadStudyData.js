import { metadata, studies, utils, log } from '@ohif/core';
import { extensionManager } from './../App.js';
import {
  MAX_LOAD_CACHE_IMAGE,
  MAX_LOAD_CACHE_SERIES,
} from '../constants/constants';

const { OHIFStudyMetadata, OHIFSeriesMetadata } = metadata;
const { retrieveStudiesMetadata, deleteStudyMetadataPromise } = studies;
const { studyMetadataManager, makeCancelable } = utils;

let cancelableSeriesPromises = {};
let cancelableStudiesPromises = {};
let loadedStudies = {};

const _addSeriesToStudy = (studyMetadata, series) => {
  const sopClassHandlerModules =
    extensionManager.modules['sopClassHandlerModule'];
  const study = studyMetadata.getData();
  const seriesMetadata = new OHIFSeriesMetadata(series, study);
  const existingSeries = studyMetadata.getSeriesByUID(series.SeriesInstanceUID);
  if (existingSeries) {
    studyMetadata.updateSeries(series.SeriesInstanceUID, seriesMetadata);
  } else {
    studyMetadata.addSeries(seriesMetadata);
  }

  studyMetadata.createAndAddDisplaySetsForSeries(
    sopClassHandlerModules,
    seriesMetadata
  );

  study.displaySets = studyMetadata.getDisplaySets();
  study.derivedDisplaySets = studyMetadata.getDerivedDatasets({
    Modality: series.Modality,
  });

  _updateStudyMetadataManager(study, studyMetadata);
};

const _updateStudyMetadataManager = (study, studyMetadata) => {
  const { StudyInstanceUID } = study;

  if (!studyMetadataManager.get(StudyInstanceUID)) {
    studyMetadataManager.add(studyMetadata);
  }
};

const _updateStudyDisplaySets = (study, studyMetadata) => {
  const sopClassHandlerModules =
    extensionManager.modules['sopClassHandlerModule'];

  if (!study.displaySets) {
    study.displaySets = studyMetadata.createDisplaySets(sopClassHandlerModules);
  }

  if (study.derivedDisplaySets) {
    studyMetadata._addDerivedDisplaySets(study.derivedDisplaySets);
  }
};

const _thinStudyData = study => {
  return {
    StudyInstanceUID: study.StudyInstanceUID,
    series: study.series.map(item => ({
      SeriesInstanceUID: item.SeriesInstanceUID,
    })),
  };
};

const preloadRemainingSeries = async (
  studyMetadata,
  maxConcurrentMetadataRequests
) => {
  const { seriesLoader } = studyMetadata.getData();
  if (!seriesLoader) return;

  const loadNextSeries = async () => {
    if (!seriesLoader.hasNext()) return;
    const series = await seriesLoader.next();
    _addSeriesToStudy(studyMetadata, series);
    return loadNextSeries();
  };

  const concurrentRequestsAllowed =
    maxConcurrentMetadataRequests || studyMetadata.getSeriesCount();
  const promises = Array(concurrentRequestsAllowed)
    .fill(null)
    .map(loadNextSeries);

  return await Promise.all(promises);
};

const preloadProcessStudies = (
  studiesData,
  filters,
  maxConcurrentMetadataRequests,
  setStudyData
) => {
  if (Array.isArray(studiesData) && studiesData.length > 0) {
    // Map studies to new format, update metadata manager?
    const studies = studiesData.map(study => {
      if (setStudyData) {
        setStudyData(study.StudyInstanceUID, _thinStudyData(study));
      }

      const studyMetadata = new OHIFStudyMetadata(
        study,
        study.StudyInstanceUID
      );

      _updateStudyDisplaySets(study, studyMetadata);
      _updateStudyMetadataManager(study, studyMetadata);

      // Attempt to load remaning series if any
      cancelableSeriesPromises[study.StudyInstanceUID] = makeCancelable(
        preloadRemainingSeries(studyMetadata, maxConcurrentMetadataRequests)
      )
        .then(result => {
          const { displaySets = [] } = study;
          displaySets.some((ds, i) => {
            if (i > MAX_LOAD_CACHE_SERIES) return true;
            ds.images.some((img, idx) => {
              if (idx > MAX_LOAD_CACHE_IMAGE) return true;
              const imageId = img.getImageId();
              window.cornerstone.loadAndCacheImage(imageId);
            });
          });
        })
        .catch(error => {
          if (error && !error.isCanceled) {
            log.error(error);
          }
        });

      return study;
    });

    studies.map(study => {
      setLoadedStudy(study.StudyInstanceUID, [study]);
    });
  }
};

export const actionPreloadNextStudies = async (
  server,
  uids = [],
  seriesInstanceUIDs,
  isFilterStrategy,
  appConfig,
  maxConcurrentMetadataRequests,
  setStudyData
) => {
  try {
    const filters = {};
    // Use the first, discard others
    const seriesInstanceUID = seriesInstanceUIDs && seriesInstanceUIDs[0];
    const retrieveParams = [server, uids];

    if (seriesInstanceUID) {
      filters.seriesInstanceUID = seriesInstanceUID;
      // Query param filtering controlled by appConfig property
      if (isFilterStrategy) {
        retrieveParams.push(filters);
      }
    }

    if (
      appConfig.splitQueryParameterCalls ||
      appConfig.enableGoogleCloudAdapter
    ) {
      retrieveParams.push(true); // Seperate SeriesInstanceUID filter calls.
    }

    cancelableStudiesPromises[uids] = makeCancelable(
      retrieveStudiesMetadata(...retrieveParams)
    )
      .then(result => {
        if (result && !result.isCanceled) {
          preloadProcessStudies(
            result,
            filters,
            maxConcurrentMetadataRequests,
            setStudyData
          );
        }
      })
      .catch(error => {
        if (error && !error.isCanceled) {
          log.error(error);
        }
      });
  } catch (error) {
    if (error) {
      log.error(error);
    }
  }
};

export const purgeCancellablePromises = () => {
  for (let studyInstanceUIDs in cancelableStudiesPromises) {
    if ('cancel' in cancelableStudiesPromises[studyInstanceUIDs]) {
      cancelableStudiesPromises[studyInstanceUIDs].cancel();
    }
  }

  for (let studyInstanceUIDs in cancelableSeriesPromises) {
    if ('cancel' in cancelableSeriesPromises[studyInstanceUIDs]) {
      cancelableSeriesPromises[studyInstanceUIDs].cancel();
      deleteStudyMetadataPromise(studyInstanceUIDs);
      studyMetadataManager.remove(studyInstanceUIDs);
    }
  }
};

export const setLoadedStudy = (key, value) => {
  if (!key) return;
  loadedStudies[key] = value;
};

export const getLoadedStudy = () => {
  return loadedStudies || {};
};

export const initLoadedStudy = () => {
  loadedStudies = {};
};
