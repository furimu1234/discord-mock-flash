// apps/server/src/types.ts

export enum ChannelType {
  GUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
}

export enum InteractionType {
  PING = 1,
  APPLICATION_COMMAND = 2,
  MESSAGE_COMPONENT = 3,
  APPLICATION_COMMAND_AUTOCOMPLETE = 4,
  MODAL_SUBMIT = 5,
}

export enum ComponentType {
  ACTION_ROW = 1,
  BUTTON = 2,
  STRING_SELECT = 3,
  TEXT_INPUT = 4,
}

export enum ButtonStyle {
  PRIMARY = 1,
  SECONDARY = 2,
  SUCCESS = 3,
  DANGER = 4,
  LINK = 5,
}

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot?: boolean;
}

export interface Role {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
}

export interface Channel {
  id: string;
  type: ChannelType;
  guild_id?: string;
  name?: string;
  position?: number;
  topic?: string | null;
  recipient_ids?: string[]; // DM用
}

export interface Embed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string; icon_url?: string };
}

export interface Component {
  type: ComponentType;
  custom_id?: string;
  disabled?: boolean;
  style?: ButtonStyle;
  label?: string;
  emoji?: { name: string; id?: string };
  url?: string;
  components?: Component[];
  placeholder?: string;
  options?: Array<{ label: string; value: string; description?: string; default?: boolean }>;
}

export interface Message {
  id: string;
  channel_id: string;
  guild_id?: string;
  author: User;
  content: string;
  timestamp: string;
  edited_timestamp: string | null;
  tts: boolean;
  mention_everyone: boolean;
  mentions: User[];
  embeds: Embed[];
  components: Component[];
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string;
  roles: Role[];
  channels: Channel[];
}

export interface VoiceState {
  guild_id?: string;
  channel_id: string;
  user_id: string;
  session_id: string;
  deaf: boolean;
  mute: boolean;
  self_deaf: boolean;
  self_mute: boolean;
}

export interface MockStateData {
  guilds: Guild[];
  users: User[];
  channels: Channel[];
  messages: Message[];
  voiceStates: VoiceState[];
  activeUserId: string; // テスト画面で現在ログイン中のダミーユーザーID
  botStreamingVoice: boolean; // BotがVCで音声を流しているかどうか
  voiceStreamingChannelId: string | null; // Botが音声ストリーミングしているチャンネルID
}
