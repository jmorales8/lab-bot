import { WebClient } from '@slack/web-api';

const token = process.env.SLACK_BOT_TOKEN;
export const slack = token ? new WebClient(token) : null;

function weekdayKey(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00-06:00`);
  const key = d
    .toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Chicago' })
    .slice(0, 3)
    .toUpperCase(); // MON, TUE, ...
  return key;
}

export function channelForDate(dateStr: string): string | null {
  const key = weekdayKey(dateStr);
  const map: Record<string, string | undefined> = {
    MON: process.env.SLACK_CHANNEL_MON,
    TUE: process.env.SLACK_CHANNEL_TUE,
    WED: process.env.SLACK_CHANNEL_WED,
    THU: process.env.SLACK_CHANNEL_THU,
    FRI: process.env.SLACK_CHANNEL_FRI,
    SAT: process.env.SLACK_CHANNEL_SAT,
    SUN: process.env.SLACK_CHANNEL_SUN,
  };
  return map[key] ?? process.env.SLACK_CHANNEL_DEFAULT ?? null;
}

export async function postDayToSlack(day: { dateStr: string; who?: string | null; lesson?: string | null }) {
  if (!slack) throw new Error('Missing SLACK_BOT_TOKEN');
  const channel = channelForDate(day.dateStr);
  if (!channel) throw new Error('No Slack channel configured (set SLACK_CHANNEL_DEFAULT or per-day env vars)');
  const text = `📅 *${day.dateStr}*\n*Who:* ${day.who?.trim() || '_(none)_'}\n*Lesson:* ${day.lesson?.trim() || '_(none)_'}\n`;
  return slack.chat.postMessage({ channel, text, mrkdwn: true });
}
