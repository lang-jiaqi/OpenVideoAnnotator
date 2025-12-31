import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle, Subtitles } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  onTimeUpdate?: (time: number) => void;
  isPaused: boolean;
  onPauseChange: (paused: boolean) => void;
  subtitleUrl?: string;
}

export function VideoPlayer({ videoUrl, onTimeUpdate, isPaused, onPauseChange, subtitleUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Reset error state when URL changes
      setHasError(false);
      setErrorMessage('');
      video.load();
    }
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && !hasError) {
      if (isPaused) {
        video.pause();
      } else {
        video.play().catch((error) => {
          console.error('Play error:', error);
          // If autoplay fails, just keep it paused
          onPauseChange(true);
        });
      }
    }
  }, [isPaused, hasError, onPauseChange]);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    let message = 'Failed to load video. ';
    
    if (video.error) {
      switch (video.error.code) {
        case 1:
          message += 'Video loading was aborted.';
          break;
        case 2:
          message += 'Network error occurred.';
          break;
        case 3:
          message += 'Video format not supported.';
          break;
        case 4:
          message += 'Video source not found.';
          break;
        default:
          message += 'Unknown error occurred.';
      }
    } else {
      message += 'Please check the URL and try again.';
    }
    
    setHasError(true);
    setErrorMessage(message);
    onPauseChange(true);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlayPause = () => {
    if (!hasError) {
      onPauseChange(!isPaused);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
    if (vol === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleSubtitles = () => {
    const video = videoRef.current;
    if (video && video.textTracks && video.textTracks.length > 0) {
      const track = video.textTracks[0];
      if (showSubtitles) {
        track.mode = 'hidden';
      } else {
        track.mode = 'showing';
      }
      setShowSubtitles(!showSubtitles);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4 h-full max-h-full">
      <div className="bg-black rounded-lg overflow-hidden relative aspect-video flex-shrink-0">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
          crossOrigin="anonymous"
          playsInline
          preload="auto"
        >
          {subtitleUrl && (
            <track
              kind="subtitles"
              src={subtitleUrl}
              srcLang="zh"
              label="中文"
              default={showSubtitles}
            />
          )}
        </video>
        
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white p-6 max-w-md">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-lg mb-2">视频错误</p>
              <p className="text-sm text-gray-300">{errorMessage}</p>
              <p className="text-xs text-gray-400 mt-4">
                提示：确保视频URL是直接链接（以 .mp4, .webm 等结尾）且可公开访问。
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        {/* Progress Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            step="0.1"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {isPaused ? (
              <Play className="w-6 h-6 text-gray-700" />
            ) : (
              <Pause className="w-6 h-6 text-gray-700" />
            )}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-gray-700" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-700" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              step="0.1"
              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Playback Speed */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600">Speed:</span>
            <div className="flex gap-1">
              {[0.5, 1, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handlePlaybackRateChange(rate)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    playbackRate === rate
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Subtitles Toggle */}
          {subtitleUrl && (
            <button
              onClick={toggleSubtitles}
              className={`p-2 rounded-full transition-colors ${
                showSubtitles
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={showSubtitles ? '隐藏字幕' : '显示字幕'}
            >
              <Subtitles className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}