// Real Unsplash profile photos for avatars
const AVATAR_IDS = [
  "ZHvM3XIOHoE", "6W4F62sN_yI", "y2T5hXv_gEg", "7Sz71zuuW4k",
  "WNoLnJo7tS8", "3TLl_97HNJo", "QXevDflbl8A", "lkMJcGDZLVs",
  "rDEOVtE7vOs", "7YVZYZeITc8", "6anudmpILw4", "KIPGxvR8ORk",
  "X6Uj51n5CE8", "QXevDflbl8A", "8UlNwlJQKr4", "9s36mJ3pGTQ",
  "d2MSDujJl2g", "nKC772R_qog", "Kt5hRENuotI", "CyFBmFEsytU"
];

const USERNAMES = [
  "photo_master", "camera_life", "light_chaser", "moment_catcher", "lens_artist",
  "shutter_speed", "focal_point", "aperture_art", "iso_master", "depth_field",
  "golden_hour", "blue_hour", "street_eye", "urban_shots", "nature_lens",
  "portrait_pro", "landscape_view", "macro_world", "night_vision", "color_theory"
];

export interface User {
  name: string;
  username: string;
  bio: string;
  location: string;
  twitter: string;
  instagram: string;
  url: string;
  avatar: string;
  followers: number;
  following: number;
}

// Generate mock users data for all 20 users
export const MOCK_USERS = Array.from({ length: 20 }, (_, i) => {
  const locations = ["東京", "大阪", "京都", "福岡", "札幌", "名古屋", "横浜", "神戸"];
  const specialties = ["風景", "ポートレート", "スナップ", "建築", "自然", "モノクローム", "ストリート", "マクロ"];
  const userNumber = i + 1;

  return {
    name: `写真家${userNumber}`,
    username: USERNAMES[i],
    bio: `${specialties[i % specialties.length]}写真を専門とするフォトグラファーです。`,
    location: `${locations[i % locations.length]}, Japan`,
    twitter: USERNAMES[i],
    instagram: USERNAMES[i],
    url: `https://${USERNAMES[i]}.com`,
    avatar: `https://images.unsplash.com/photo-${AVATAR_IDS[i]}?w=128&h=128&fit=crop&crop=faces`,
    followers: Math.floor(Math.random() * 2000) + 500,
    following: Math.floor(Math.random() * 1000) + 300,
  };
});

const MOCK_POSTS = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1493514789931-586cb221d7a7?w=1200&h=900&fit=crop&q=80",
    user: {
      name: "佐藤 健",
      username: "photo_master",
      avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=128&h=128&fit=crop&crop=faces",
    },
    description: "夕暮れの海岸で撮影。波と空が織りなす色彩のグラデーションに魅了されました。",
    shutterSpeed: "1/1000",
    iso: 100,
    aperture: 2.8,
    location: "江ノ島",
    shootingDate: "2024/03/20",
    likes: 120,
    comments: 15,
    createdAt: "2024-03-20T18:30:00Z",
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=1200&h=900&fit=crop&q=80",
    user: {
      name: "田中 美咲",
      username: "camera_life",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=faces",
    },
    description: "都会の夜景。ネオンが織りなす光の芸術に心を奪われました。",
    shutterSpeed: "1/60",
    iso: 800,
    aperture: 1.8,
    location: "渋谷スカイ",
    shootingDate: "2024/03/19",
    likes: 85,
    comments: 8,
    createdAt: "2024-03-19T22:15:00Z",
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1578271887552-5ac3a72752bc?w=1200&h=900&fit=crop&q=80",
    user: {
      name: "鈴木 大輔",
      username: "light_chaser",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=128&h=128&fit=crop&crop=faces",
    },
    description: "富士山の朝焼け。静寂の中で見る山の姿は格別でした。",
    shutterSpeed: "1/250",
    iso: 200,
    aperture: 8,
    location: "山中湖",
    shootingDate: "2024/03/18",
    likes: 156,
    comments: 12,
    createdAt: "2024-03-18T05:30:00Z",
  },
  {
    id: "4",
    imageUrl: "https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?w=1200&h=900&fit=crop&q=80",
    user: {
      name: "山本 花子",
      username: "moment_catcher",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&h=128&fit=crop&crop=faces",
    },
    description: "京都の古寺で撮影。歴史ある建築美に魅了されました。",
    shutterSpeed: "1/125",
    iso: 400,
    aperture: 4,
    location: "清水寺",
    shootingDate: "2024/03/17",
    likes: 98,
    comments: 6,
    createdAt: "2024-03-17T09:15:00Z",
  },
  {
    id: "5",
    imageUrl: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1200&h=900&fit=crop&q=80",
    user: {
      name: "中村 翔太",
      username: "lens_artist",
      avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=128&h=128&fit=crop&crop=faces",
    },
    description: "雪山での撮影。真っ白な世界に心が洗われる思いでした。",
    shutterSpeed: "1/500",
    iso: 200,
    aperture: 5.6,
    location: "白馬岳",
    shootingDate: "2024/03/16",
    likes: 142,
    comments: 10,
    createdAt: "2024-03-16T11:30:00Z",
  }
];

export const generateMockPosts = (count: number, seed = 0) => {
  // Return a slice of the mock posts, cycling through them if more are needed
  const result = [];
  for (let i = 0; i < count; i++) {
    const index = (seed + i) % MOCK_POSTS.length;
    result.push({
      ...MOCK_POSTS[index],
      id: `${seed}-${i + 1}`, // Ensure unique IDs
    });
  }
  return result;
};