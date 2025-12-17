export interface Profile {
  name: string;
  domain: string;
  email: string;
  token: string;
  createdAt: string;
}

export interface AppConfig {
  profiles: Record<string, Profile>;
  activeProfile: string;
}
