import appState from './../../appState.js';
import createVtkVolumeAsync from './createVtkVolumeAsync.js';

export default async function(seriesNumber, imageDataObject) {
  let vtkVolume = appState.vtkVolumes[seriesNumber];
  if (!vtkVolume) {
    vtkVolume = await createVtkVolumeAsync(
      appState.series[seriesNumber],
      imageDataObject
    );
    appState.vtkVolumes[seriesNumber] = vtkVolume;
  }
  return vtkVolume;
}
