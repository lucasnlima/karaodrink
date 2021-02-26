import React, { useState } from "react";
import YouTube from "react-youtube";
import { useParams } from "react-router-dom";
import { useHistory } from "react-router-dom";

const VideoPage = () => {
  const { id } = useParams();
  const history = useHistory();

  const handleOnEnd = () => {
    history.push("/score");
  };

  return (
    <div class="video-foreground">
      <YouTube
        videoId={id}
        opts={{
          height: window.screen.height,
          width: window.screen.width,
          playerVars: {
            showinfo: 0,
            controls: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 0,
            rel: 0,
            autoplay: 1,
          },
        }}
        onEnd={handleOnEnd}
      />
    </div>
  );
};

export default VideoPage;
