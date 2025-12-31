import { useState } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { YouTubePlayer } from './components/YouTubePlayer';
import { AnnotationPanel, Annotation } from './components/AnnotationPanel';
import { Link, Upload } from 'lucide-react';

// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export default function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [videoType, setVideoType] = useState<'youtube' | 'direct'>('direct');
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [videoFileName, setVideoFileName] = useState('');
  const [subtitleUrl, setSubtitleUrl] = useState('');
  const [subtitleFileName, setSubtitleFileName] = useState('');

  const handleLoadVideo = () => {
    if (inputUrl.trim()) {
      const youtubeId = extractYouTubeVideoId(inputUrl);
      
      if (youtubeId) {
        setVideoType('youtube');
        setYoutubeVideoId(youtubeId);
        setVideoUrl(inputUrl);
        setVideoFileName('');
      } else {
        setVideoType('direct');
        setVideoUrl(inputUrl);
        setVideoFileName(inputUrl.split('/').pop() || '');
      }
      
      setAnnotations([]);
      setIsPaused(true);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setVideoType('direct');
      setVideoUrl(fileUrl);
      setVideoFileName(file.name);
      setInputUrl('');
      setAnnotations([]);
      setIsPaused(true);
    }
  };

  const handleSubtitleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      
      // 如果是 .srt 文件，转换为 .vtt
      if (fileName.endsWith('.srt')) {
        const text = await file.text();
        const vttContent = convertSrtToVtt(text);
        const vttBlob = new Blob([vttContent], { type: 'text/vtt' });
        const vttUrl = URL.createObjectURL(vttBlob);
        setSubtitleUrl(vttUrl);
        setSubtitleFileName(file.name);
      } else if (fileName.endsWith('.vtt')) {
        // .vtt 文件直接使用
        const vttUrl = URL.createObjectURL(file);
        setSubtitleUrl(vttUrl);
        setSubtitleFileName(file.name);
      } else {
        alert('请上传 .srt 或 .vtt 格式的字幕文件');
      }
    }
  };

  // 将 SRT 格式转换为 VTT 格式
  const convertSrtToVtt = (srt: string): string => {
    let vtt = 'WEBVTT\n\n';
    // 将 SRT 时间格式 (00:00:00,000) 转换为 VTT 格式 (00:00:00.000)
    vtt += srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    return vtt;
  };

  const handleStartAnnotation = () => {
    setIsAnnotating(true);
    setIsPaused(true);
  };

  const handleDoneAnnotation = (type: 'VLM' | 'LLM', question: string, requirements: string, feedbackDuration: number, manualTimestamp?: number) => {
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      timestamp: manualTimestamp ?? currentTime,
      type,
      question,
      requirements,
      feedbackDuration,
    };
    setAnnotations([...annotations, newAnnotation]);
    setIsAnnotating(false);
    setIsPaused(false); // Resume playback after annotation
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(ann => ann.id !== id));
  };

  const handleUpdateAnnotation = (id: string, updatedAnnotation: Omit<Annotation, 'id'>) => {
    setAnnotations(annotations.map(ann => 
      ann.id === id ? { ...updatedAnnotation, id } : ann
    ));
  };

  const handleGenerateJSON = () => {
    const jsonData = {
      videoUrl,
      totalAnnotations: annotations.length,
      annotations: annotations.map(({ id, ...rest }) => rest),
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-annotations-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-6">Open Video Annotator</h1>
          
          {/* Video URL Input */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              加载视频
            </label>
            
            {/* Info Banner */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>推荐：</strong>使用"上传本地文件"获得最佳体验！可以精确获取时间戳，无网络限制。
              </p>
              <p className="text-xs text-blue-700 mt-1">
                YouTube 视频可能因版权限制无法嵌入播放（错误150）。您可以先下载视频，然后上传到这里。
              </p>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                YouTube / URL
              </button>
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center gap-2"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="w-4 h-4" />
                上传本地文件 ⭐
              </button>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="粘贴 YouTube URL 或直接视频链接 (如: https://www.youtube.com/watch?v=...)" 
                  className="w-full py-3 px-4 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
                />
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <button
                onClick={handleLoadVideo}
                disabled={!inputUrl.trim()}
                className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                加载视频
              </button>
            </div>
            
            {/* Hidden file input */}
            <input
              id="file-upload"
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {videoFileName && (
              <p className="mt-2 text-sm text-green-600">
                ✓ 已加载: {videoFileName}
              </p>
            )}
            
            {/* Subtitle Upload Section */}
            {videoUrl && videoType === 'direct' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  添加字幕（可选）
                </label>
                <button
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors flex items-center gap-2"
                  onClick={() => document.getElementById('subtitle-upload')?.click()}
                >
                  <Upload className="w-4 h-4" />
                  上传字幕文件 (.srt / .vtt)
                </button>
                <input
                  id="subtitle-upload"
                  type="file"
                  accept=".srt,.vtt"
                  onChange={handleSubtitleUpload}
                  className="hidden"
                />
                {subtitleFileName && (
                  <p className="mt-2 text-sm text-purple-600">
                    ✓ 字幕已加载: {subtitleFileName}
                  </p>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        {videoUrl ? (
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Video Player */}
            <div>
              {videoType === 'youtube' ? (
                <YouTubePlayer
                  videoId={youtubeVideoId}
                  onTimeUpdate={setCurrentTime}
                  isPaused={isPaused}
                  onPauseChange={setIsPaused}
                />
              ) : (
                <VideoPlayer
                  videoUrl={videoUrl}
                  onTimeUpdate={setCurrentTime}
                  isPaused={isPaused}
                  onPauseChange={setIsPaused}
                  subtitleUrl={subtitleUrl}
                />
              )}
            </div>

            {/* Right: Annotation Panel */}
            <div>
              <AnnotationPanel
                isAnnotating={isAnnotating}
                onStartAnnotation={handleStartAnnotation}
                onDoneAnnotation={handleDoneAnnotation}
                annotations={annotations}
                onGenerateJSON={handleGenerateJSON}
                onDeleteAnnotation={handleDeleteAnnotation}
                onUpdateAnnotation={handleUpdateAnnotation}
                currentTime={currentTime}
              />
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-240px)] flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-lg">请进入一个视频 URL 以开始</p>
              <p className="text-sm mt-2">支持 YouTube 和直接视频链接</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}