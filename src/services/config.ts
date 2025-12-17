import Conf from 'conf';
import type { Profile, AppConfig } from '../types/config.js';

const config = new Conf<AppConfig>({
  projectName: 'jira-cli',
  defaults: {
    profiles: {},
    activeProfile: '',
  },
});

export function getAllProfiles(): Record<string, Profile> {
  return config.get('profiles');
}

export function getProfile(name: string): Profile | undefined {
  const profiles = config.get('profiles');
  return profiles[name];
}

export function getActiveProfile(): Profile | null {
  const activeProfileName = config.get('activeProfile');
  if (!activeProfileName) {
    return null;
  }
  const profiles = config.get('profiles');
  return profiles[activeProfileName] || null;
}

export function getActiveProfileName(): string {
  return config.get('activeProfile');
}

export function createProfile(profile: Profile): void {
  const profiles = config.get('profiles');
  profiles[profile.name] = profile;
  config.set('profiles', profiles);

  // If this is the first profile, make it active
  if (!config.get('activeProfile')) {
    config.set('activeProfile', profile.name);
  }
}

export function setActiveProfile(name: string): boolean {
  const profiles = config.get('profiles');
  if (!profiles[name]) {
    return false;
  }
  config.set('activeProfile', name);
  return true;
}

export function deleteProfile(name: string): boolean {
  const profiles = config.get('profiles');
  if (!profiles[name]) {
    return false;
  }

  delete profiles[name];
  config.set('profiles', profiles);

  // If we deleted the active profile, clear it or set to another
  if (config.get('activeProfile') === name) {
    const remainingProfiles = Object.keys(profiles);
    config.set('activeProfile', remainingProfiles[0] || '');
  }

  return true;
}

export function profileExists(name: string): boolean {
  const profiles = config.get('profiles');
  return name in profiles;
}

export function maskToken(token: string): string {
  if (token.length <= 4) {
    return '*'.repeat(token.length);
  }
  return '*'.repeat(20) + token.slice(-4);
}
