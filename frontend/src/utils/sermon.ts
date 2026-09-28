/**
 * A sermon as returned by GET /sermons: YouTube playlist data merged with any
 * admin overrides (title, speaker, description, scripture) from Sermon Manager.
 * Mirrors the dict built in backend/app/apis/youtube.
 */
export interface Sermon {
  video_id: string;
  title: string;
  description: string;
  published_at: string; // ISO timestamp
  thumbnail_url: string | null;
  speaker: string;
  duration: number; // minutes
  scripture: string | null;
  /** False when the video can't be played on other sites (embedding disabled on YouTube). */
  embeddable?: boolean;
}

export const youtubeWatchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;
