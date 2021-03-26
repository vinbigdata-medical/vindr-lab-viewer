const series = {};

export const setSerires = (seriesId, data) => {
  series[seriesId] = data || [];
};

export default {
  series,
  vtkVolumes: {},
};
