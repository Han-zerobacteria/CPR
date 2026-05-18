export type DuplicateCheckResponse = {
  available: boolean;
  detail?: string | string[];
};

export type SignupResponse = {
  accessToken: string;
  user: {
    id: string | number;
    login_id: string;
  };
  profile: {
    nickname: string;
    profile_image_url?: string | null;
    bio?: string;
  };
};

export type SignupField =
  | "login_id"
  | "password"
  | "confirm_password"
  | "nickname"
  | "profile_image"
  | "bio";
