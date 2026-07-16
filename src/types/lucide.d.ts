declare module 'lucide-react-native' {
  import React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  export interface LucideProps {
    size?: number | string;
    color?: string;
    fill?: string;
    strokeWidth?: number | string;
    style?: StyleProp<ViewStyle>;
  }

  export type Icon = React.FC<LucideProps>;

  export const Home: Icon;
  export const Zap: Icon;
  export const Plus: Icon;
  export const Tv: Icon;
  export const User: Icon;
  export const Crown: Icon;
  export const Check: Icon;
  export const X: Icon;
  export const ShieldAlert: Icon;
  export const Bell: Icon;
  export const Cast: Icon;
  export const Play: Icon;
  export const MessageCircle: Icon;
  export const Share2: Icon;
  export const ThumbsUp: Icon;
  export const ThumbsDown: Icon;
  export const CornerUpRight: Icon;
  export const PlusSquare: Icon;
  export const ChevronDown: Icon;
  export const UserPlus: Icon;
  export const ArrowLeft: Icon;
  export const BarChart2: Icon;
  export const DollarSign: Icon;
  export const Eye: Icon;
  export const MousePointer: Icon;
  export const Speaker: Icon;
  export const Edit2: Icon;
  export const LogOut: Icon;
  export const Award: Icon;
  
  // Custom icons used in components
  export const Lock: Icon;
  export const Mail: Icon;
  export const Settings: Icon;
  export const Heart: Icon;
  export const Film: Icon;
  export const Image: Icon;
  export const Video: Icon;
  export const BellOff: Icon;
  export const CheckCheck: Icon;
  export const HeartOff: Icon;
  export const ExternalLink: Icon;
  export const Send: Icon;
  export const MessageSquareOff: Icon;
  export const RotateCcw: Icon;
  export const Volume2: Icon;
  export const VolumeX: Icon;
}
