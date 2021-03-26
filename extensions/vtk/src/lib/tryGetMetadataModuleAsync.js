import * as cornerstone from 'cornerstone-core';

export default async function(metadataModule, imageId) {
  let imageMetadata = cornerstone.metaData.get(metadataModule, imageId);

  if (!imageMetadata) {
    await cornerstone.loadAndCacheImage(imageId);
    imageMetadata = cornerstone.metaData.get(metadataModule, imageId);
  }

  return imageMetadata;
}
