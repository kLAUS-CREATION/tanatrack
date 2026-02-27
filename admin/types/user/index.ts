export enum ProfileTheme {
  DEFAULT = 'default',
  MINIMAL = 'minimal',
  NEO = 'neo',
  CLASSIC = 'classic',
}

export interface User {
  id: string;
  name: string;
  username: string;
  displayUsername?: string;
  email?: string;
  image?: string;
  bio?: string;
  country?: string;
  city?: string;
  languages: string[];

  // Counters
  followingCount: number;
  followerCount: number;
  postsCount: number;
  communitiesCount: number;
  likesReceivedCount: number;
  profileViewsCount: number;

  // Settings & Status
  profileTheme: ProfileTheme;
  isVerified: boolean;
  isOnline: boolean;
  lastActiveAt?: string;
  createdAt: string;
}

export interface UpdateProfileDto {
  displayUsername?: string;
  bio?: string;
  country?: string;
  city?: string;
  languages?: string[];
  image?: string;
}

export interface UpdatePreferencesDto {
  allowMessages?: boolean;
  allowMentions?: boolean;
  showActivityStatus?: boolean;
  profileTheme?: ProfileTheme;
}

export interface SearchUserResult {
  id: string;
  name: string;
  username: string;
  image?: string;
  followerCount: number;
  isVerified: boolean;
}
