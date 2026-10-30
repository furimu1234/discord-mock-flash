// apps/server/src/state/store.ts
import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import {
  MockStateData,
  Guild,
  Channel,
  Role,
  User,
  Message,
  VoiceState,
  ChannelType,
} from '../types.js';

export class StateStore extends EventEmitter {
  private data: MockStateData;
  private filePath: string;
  private idCounter = 1000000000000000n;

  constructor(filePath?: string) {
    super();
    this.filePath = filePath || path.resolve(process.cwd(), 'data', 'discord-mock-state.json');
    this.data = this.loadInitialData();
  }

  public nextId(): string {
    this.idCounter += 1n;
    return this.idCounter.toString();
  }

  private getDefaultState(): MockStateData {
    const botUser: User = {
      id: '100000000000000001',
      username: 'TargetBot',
      discriminator: '0001',
      avatar: null,
      bot: true,
    };

    const alice: User = {
      id: '100000000000000002',
      username: 'Alice',
      discriminator: '1234',
      avatar: null,
      bot: false,
    };

    const bob: User = {
      id: '100000000000000003',
      username: 'Bob',
      discriminator: '5678',
      avatar: null,
      bot: false,
    };

    const guildId = '200000000000000001';
    const textChannelId = '300000000000000001';
    const voiceChannelId = '300000000000000002';

    const defaultRoles: Role[] = [
      {
        id: guildId, // @everyone role ID matches guild ID in Discord
        name: '@everyone',
        color: 0,
        hoist: false,
        position: 0,
        permissions: '1071698660929',
        managed: false,
        mentionable: false,
      },
      {
        id: '400000000000000001',
        name: 'Admin',
        color: 0xe91e63,
        hoist: true,
        position: 1,
        permissions: '8',
        managed: false,
        mentionable: true,
      },
    ];

    const defaultChannels: Channel[] = [
      {
        id: textChannelId,
        type: ChannelType.GUILD_TEXT,
        guild_id: guildId,
        name: 'general',
        position: 0,
        topic: 'General discussion channel',
      },
      {
        id: voiceChannelId,
        type: ChannelType.GUILD_VOICE,
        guild_id: guildId,
        name: 'General VC',
        position: 1,
      },
      // Alice宛てのDMチャンネル
      {
        id: '300000000000000010',
        type: ChannelType.DM,
        recipient_ids: [botUser.id, alice.id],
      },
      // Bob宛てのDMチャンネル
      {
        id: '300000000000000020',
        type: ChannelType.DM,
        recipient_ids: [botUser.id, bob.id],
      },
    ];

    const defaultGuild: Guild = {
      id: guildId,
      name: 'Test Server',
      icon: null,
      owner_id: alice.id,
      roles: defaultRoles,
      channels: defaultChannels.filter((c) => c.guild_id === guildId),
    };

    const initialMessages: Message[] = [
      {
        id: '500000000000000001',
        channel_id: textChannelId,
        guild_id: guildId,
        author: alice,
        content: 'Hello world from Alice in discord-mock!',
        timestamp: new Date().toISOString(),
        edited_timestamp: null,
        tts: false,
        mention_everyone: false,
        mentions: [],
        embeds: [],
        components: [],
      },
      {
        id: '500000000000000002',
        channel_id: '300000000000000010', // Alice宛てのDM
        author: botUser,
        content: '秘密の通知: Aliceさん、これはあなただけに届いたDMです。',
        timestamp: new Date().toISOString(),
        edited_timestamp: null,
        tts: false,
        mention_everyone: false,
        mentions: [],
        embeds: [],
        components: [],
      },
      {
        id: '500000000000000003',
        channel_id: '300000000000000020', // Bob宛てのDM
        author: botUser,
        content: '機密連絡: Bobさん、Bob専用のDM内容です。',
        timestamp: new Date().toISOString(),
        edited_timestamp: null,
        tts: false,
        mention_everyone: false,
        mentions: [],
        embeds: [],
        components: [],
      },
    ];

    return {
      guilds: [defaultGuild],
      users: [botUser, alice, bob],
      channels: defaultChannels,
      messages: initialMessages,
      voiceStates: [],
      activeUserId: alice.id, // 初期ログインはAlice
      botStreamingVoice: false,
      voiceStreamingChannelId: null,
    };
  }

  private loadInitialData(): MockStateData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(`[Store] Could not load state from ${this.filePath}, using defaults:`, e);
    }
    const defaults = this.getDefaultState();
    this.saveData(defaults);
    return defaults;
  }

  public save(): void {
    this.saveData(this.data);
  }

  private saveData(data: MockStateData): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`[Store] Failed to save state to ${this.filePath}:`, e);
    }
  }

  public getState(): MockStateData {
    return this.data;
  }

  public reset(): MockStateData {
    this.data = this.getDefaultState();
    this.save();
    this.emit('change', this.data);
    return this.data;
  }

  // Active User Switch (ダミーユーザーなりすましログイン)
  public setActiveUser(userId: string): User | undefined {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      this.data.activeUserId = userId;
      this.save();
      this.emit('change', this.data);
      return user;
    }
    return undefined;
  }

  public getActiveUser(): User {
    const user = this.data.users.find((u) => u.id === this.data.activeUserId);
    return user || this.data.users[1]; // fallback to first non-bot
  }

  // User CRUD
  public createUser(userData: Partial<User> & { username: string }): User {
    const user: User = {
      id: userData.id || this.nextId(),
      username: userData.username,
      discriminator: userData.discriminator || '0000',
      avatar: userData.avatar || null,
      bot: userData.bot || false,
    };
    this.data.users.push(user);
    this.save();
    this.emit('change', this.data);
    return user;
  }

  public deleteUser(userId: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      this.data.users.splice(idx, 1);
      if (this.data.activeUserId === userId) {
        this.data.activeUserId = this.data.users[0]?.id || '';
      }
      this.save();
      this.emit('change', this.data);
      return true;
    }
    return false;
  }

  // Guild & Channel CRUD
  public createGuild(guildData: Partial<Guild> & { name: string }): Guild {
    const id = guildData.id || this.nextId();
    const guild: Guild = {
      id,
      name: guildData.name,
      icon: guildData.icon || null,
      owner_id: guildData.owner_id || this.getActiveUser().id,
      roles: guildData.roles || [
        {
          id,
          name: '@everyone',
          color: 0,
          hoist: false,
          position: 0,
          permissions: '1071698660929',
          managed: false,
          mentionable: false,
        },
      ],
      channels: [],
    };
    this.data.guilds.push(guild);
    this.save();
    this.emit('change', this.data);
    return guild;
  }

  public createChannel(
    channelData: Partial<Channel> & { name?: string; type: ChannelType; guild_id?: string }
  ): Channel {
    const channel: Channel = {
      id: channelData.id || this.nextId(),
      type: channelData.type,
      guild_id: channelData.guild_id,
      name: channelData.name || (channelData.type === ChannelType.DM ? 'Direct Message' : 'channel'),
      position: channelData.position || 0,
      topic: channelData.topic || null,
      recipient_ids: channelData.recipient_ids,
    };
    this.data.channels.push(channel);
    if (channel.guild_id) {
      const guild = this.data.guilds.find((g) => g.id === channel.guild_id);
      if (guild) {
        guild.channels.push(channel);
      }
    }
    this.save();
    this.emit('change', this.data);
    return channel;
  }

  public deleteChannel(channelId: string): boolean {
    const idx = this.data.channels.findIndex((c) => c.id === channelId);
    if (idx !== -1) {
      const channel = this.data.channels[idx];
      this.data.channels.splice(idx, 1);
      if (channel.guild_id) {
        const guild = this.data.guilds.find((g) => g.id === channel.guild_id);
        if (guild) {
          guild.channels = guild.channels.filter((c) => c.id !== channelId);
        }
      }
      this.save();
      this.emit('change', this.data);
      return true;
    }
    return false;
  }

  // Messages
  public addMessage(msg: Partial<Message> & { channel_id: string; author: User; content: string }): Message {
    const channel = this.data.channels.find((c) => c.id === msg.channel_id);
    const message: Message = {
      id: msg.id || this.nextId(),
      channel_id: msg.channel_id,
      guild_id: channel?.guild_id,
      author: msg.author,
      content: msg.content,
      timestamp: msg.timestamp || new Date().toISOString(),
      edited_timestamp: null,
      tts: false,
      mention_everyone: false,
      mentions: msg.mentions || [],
      embeds: msg.embeds || [],
      components: msg.components || [],
    };
    this.data.messages.push(message);
    this.save();
    this.emit('message', message);
    this.emit('change', this.data);
    return message;
  }

  // Voice States
  public joinVoice(userId: string, channelId: string): VoiceState {
    const channel = this.data.channels.find((c) => c.id === channelId);
    let state = this.data.voiceStates.find((vs) => vs.user_id === userId);
    if (state) {
      state.channel_id = channelId;
      state.guild_id = channel?.guild_id;
    } else {
      state = {
        guild_id: channel?.guild_id,
        channel_id: channelId,
        user_id: userId,
        session_id: 'mock-session-' + userId,
        deaf: false,
        mute: false,
        self_deaf: false,
        self_mute: false,
      };
      this.data.voiceStates.push(state);
    }
    this.save();
    this.emit('voiceStateUpdate', state);
    this.emit('change', this.data);
    return state;
  }

  public leaveVoice(userId: string): VoiceState | null {
    const idx = this.data.voiceStates.findIndex((vs) => vs.user_id === userId);
    if (idx !== -1) {
      const removed = this.data.voiceStates.splice(idx, 1)[0];
      const exitState: VoiceState = {
        ...removed,
        channel_id: '', // Empty channel_id indicates disconnection in Discord
      };
      this.save();
      this.emit('voiceStateUpdate', exitState);
      this.emit('change', this.data);
      return exitState;
    }
    return null;
  }

  // Voice Streaming simulation (Botが音楽ストリーミングを再生中かどうか)
  public setBotStreamingVoice(streaming: boolean, channelId: string | null): void {
    this.data.botStreamingVoice = streaming;
    this.data.voiceStreamingChannelId = channelId;
    this.save();
    this.emit('voiceStreamingChange', { streaming, channelId });
    this.emit('change', this.data);
  }
}

