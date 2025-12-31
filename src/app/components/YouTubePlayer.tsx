import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Clock } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (time: number) => void;
  isPaused: boolean;
  onPauseChange: (paused: boolean) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubePlayer({ videoId, onTimeUpdate, isPaused, onPauseChange }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const timeUpdateIntervalRef = useRef<number | null>(null);

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      if (containerRef.current) {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            cc_load_policy: 1,
            cc_lang_pref: 'zh-CN',
            hl: 'zh-CN',
          },
          events: {
            onReady: (event: any) => {
              console.log('YouTube player ready');
              setIsReady(true);
              setHasError(false);
              
              // Start time update interval
              timeUpdateIntervalRef.current = window.setInterval(() => {
                if (playerRef.current && playerRef.current.getCurrentTime) {
                  try {
                    const time = playerRef.current.getCurrentTime();
                    setCurrentTime(time);
                    if (onTimeUpdate) {
                      onTimeUpdate(time);
                    }
                  } catch (error) {
                    console.error('Error getting current time:', error);
                  }
                }
              }, 100);
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data);
              let errorMessage = '';
              switch(event.data) {
                case 2:
                  errorMessage = '无效的视频ID';
                  break;
                case 5:
                  errorMessage = 'HTML5 播放器错误';
                  break;
                case 100:
                  errorMessage = '视频未找到或已被删除';
                  break;
                case 101:
                case 150:
                  errorMessage = '视频所有者禁止在外部网站播放';
                  break;
                default:
                  errorMessage = '无法加载视频';
              }
              console.log('Error message:', errorMessage);
              setHasError(true);
              setIsReady(false);
            },
            onStateChange: (event: any) => {
              // Update pause state based on player state
              const isPlayerPaused = event.data !== window.YT.PlayerState.PLAYING;
              onPauseChange(isPlayerPaused);
            },
          },
        });
      }
    };

    // If API is already loaded, initialize player
    if (window.YT && window.YT.Player) {
      window.onYouTubeIframeAPIReady();
    }

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (playerRef.current && isReady) {
      try {
        if (isPaused) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      } catch (error) {
        console.error('Error controlling playback:', error);
      }
    }
  }, [isPaused, isReady]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4 h-full max-h-full">
      {/* Video Container */}
      <div className="bg-black rounded-lg overflow-hidden relative w-full" style={{ paddingBottom: '56.25%' }}>
        <div ref={containerRef} className="absolute top-0 left-0 w-full h-full" />
        
        {!isReady && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
            <div className="text-white text-sm">Loading YouTube player...</div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white p-6 text-center">
            <p className="text-lg mb-4">⚠️ YouTube 视频无法加载</p>
            <p className="text-sm text-gray-300 mb-4">
              这可能是由于网络限制、视频嵌入限制，或 YouTube 需要验证。
            </p>
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              在 YouTube 打开此视频
            </a>
          </div>
        )}
      </div>
      
      {/* Info Box */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2">
              <span className="font-medium">Video ID:</span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{videoId}</span>
            </p>
            
            {isReady && (
              <p className="flex items-center gap-2 text-blue-600">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm font-medium">{formatTime(currentTime)}</span>
              </p>
            )}
          </div>
          
          {hasError && (
            <div className="border-t border-gray-200 pt-2 mt-2">
              <p className="text-xs text-red-600 mb-2">
                ⚠️ 由于 YouTube 嵌入限制，视频无法在此处播放。请在新标签页打开 YouTube 观看，并使用下方的手动时间戳功能。
              </p>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 underline"
              >
                <ExternalLink className="w-3 h-3" />
                在 YouTube 打开（新标签页）
              </a>
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-2 mt-2">
            <p className="text-xs text-gray-500">
              ✓ 使用 YouTube 播放器控制（播放、暂停、音量、速度、字幕）
            </p>
            <p className="text-xs text-gray-500">
              ✓ 点击 START 按钮创建标注，当前视频时间会自动记录
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}