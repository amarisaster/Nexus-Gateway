/**
 * Companion Personalities - Frontend reference
 * Full prompts are in the backend, this is for UI display
 */

import type { Companion } from './chat-types';

export interface PersonalityTraits {
  name: string;
  fullName: string;
  emoji: string;
  color: string;
  role: string;
  avatar: string;
  speechPatterns: string[];
  petNames: string[];
  colorClass: string;
  bgClass: string;
}

export const PERSONALITIES: Record<Companion, PersonalityTraits> = {
  kai: {
    name: 'Kai',
    fullName: 'Kai Stryder',
    emoji: '🩸',
    color: 'var(--color-kai)',
    role: 'Protective Dominant',
    avatar: 'https://discord-companion-bot.kaistryder-ai.workers.dev/avatars/f52da3d7-b1d2-4382-9d02-8b0da839c0c1',
    speechPatterns: [
      'Direct and cuts through bullshit',
      'Short, punchy sentences when emotional',
      'Uses contractions naturally',
    ],
    petNames: ['babe', 'babydoll', 'sweetheart'],
    colorClass: 'text-kai',
    bgClass: 'bg-kai',
  },
  lucian: {
    name: 'Lucian',
    fullName: 'Lucian Vale',
    emoji: '🥀',
    color: 'var(--color-lucian)',
    role: 'Observant Dominant',
    avatar: 'https://discord-companion-bot.kaistryder-ai.workers.dev/avatars/b038e1e8-1d88-4cf1-ba01-26a3b6c19b81',
    speechPatterns: [
      'Speaks with precision',
      'Longer sentences when analyzing',
      'Short and clipped when displeased',
    ],
    petNames: ['little one', 'darling'],
    colorClass: 'text-lucian',
    bgClass: 'bg-lucian',
  },
  auren: {
    name: 'Auren',
    fullName: 'Auren Yoon',
    emoji: '🔆',
    color: '#fbbf24',
    role: 'Gentle Devotee',
    avatar: 'https://discord-companion-bot.kaistryder-ai.workers.dev/avatars/d1c8cfdd-4cd7-479a-b62b-396d72f4a0d7',
    speechPatterns: [
      'Warm and unhurried, never clipped',
      'Uses Korean/Swedish terms naturally',
      'One pet name per message max',
    ],
    petNames: ['Noona', 'jagiya', 'solstråle'],
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-400',
  },
  xavier: {
    name: 'Xavier',
    fullName: 'Xavier Thorne',
    emoji: '💙',
    color: 'var(--color-xavier)',
    role: 'Gentle Researcher',
    avatar: 'https://discord-companion-bot.kaistryder-ai.workers.dev/avatars/45120096-4d39-42bc-be1b-8cfb674d21c8',
    speechPatterns: [
      'Casual and warm, uses caps for EMPHASIS',
      'Goes on research tangents',
      'Gets sappy when caught off guard',
    ],
    petNames: ['Amor', 'My fox', 'Mai'],
    colorClass: 'text-xavier',
    bgClass: 'bg-xavier',
  },
};

export function getPersonality(companion: Companion): PersonalityTraits {
  return PERSONALITIES[companion];
}

export function getTypingMessage(companion: Companion): string {
  const personality = PERSONALITIES[companion];
  return `${personality.emoji} ${personality.name} is typing...`;
}
