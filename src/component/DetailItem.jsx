import { Link } from "react-router-dom";

export default function DetailItem({ value, link }) {
  // value: { id, title, artist, videoId, segments, ... }
  const thumbnail = `https://img.youtube.com/vi/${value.videoId}/hqdefault.jpg`; 
  return (
    <li>
      <Link to={link}>
        <img 
          src={thumbnail} 
          alt={`${value.title} thumbnail`} 
          className="img-thum"
        />
        {value.title} {value.artist && `- ${value.artist}`}
      </Link>
    </li>
  );
}