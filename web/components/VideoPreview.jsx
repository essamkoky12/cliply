import Image from 'next/image';

export default function VideoPreview({ video }) {
  if (video.thumbnail) {
    return <Image className="thumbnail" src={video.thumbnail} alt="" width={178} height={100} unoptimized referrerPolicy="no-referrer" />;
  }
  return <div className="thumbnail thumbnail-placeholder" aria-hidden="true">Media source</div>;
}
