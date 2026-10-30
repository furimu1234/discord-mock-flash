// packages/client-js/src/index.ts

export interface ClientOptions {
  baseUrl?: string;
}

export class DiscordMockClient {
  private baseUrl: string;
  private currentUserId?: string;

  constructor(options: ClientOptions = {}) {
    this.baseUrl = (options.baseUrl || 'http://127.0.0.1:3000').replace(/\/$/, '');
  }

  public asUser(userOrId: { id: string } | string): DiscordMockClient {
    const clone = new DiscordMockClient({ baseUrl: this.baseUrl });
    clone.currentUserId = typeof userOrId === 'string' ? userOrId : userOrId.id;
    return clone;
  }

  public async getState(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/mock/state`);
    return res.json();
  }

  public async resetState(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/mock/reset`, { method: 'POST' });
    return res.json();
  }

  public async createUser(userData: { username: string; discriminator?: string; bot?: boolean }): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/mock/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return res.json();
  }

  public async createChannel(channelData: { name: string; type: number; guild_id?: string }): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/mock/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(channelData),
    });
    return res.json();
  }

  public async sendMessage(channelId: string, content: string): Promise<any> {
    if (this.currentUserId) {
      await fetch(`${this.baseUrl}/api/mock/switch-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.currentUserId }),
      });
    }

    const res = await fetch(`${this.baseUrl}/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.json();
  }

  public async executeCommand(channelId: string, commandName: string, options: any[] = []): Promise<any> {
    if (this.currentUserId) {
      await fetch(`${this.baseUrl}/api/mock/switch-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.currentUserId }),
      });
    }

    const res = await fetch(`${this.baseUrl}/api/mock/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 2, // APPLICATION_COMMAND
        channel_id: channelId,
        data: {
          name: commandName.replace(/^\//, ''),
          type: 1,
          options,
        },
      }),
    });
    return res.json();
  }

  public async clickButton(channelId: string, customId: string): Promise<any> {
    if (this.currentUserId) {
      await fetch(`${this.baseUrl}/api/mock/switch-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.currentUserId }),
      });
    }

    const res = await fetch(`${this.baseUrl}/api/mock/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 3, // MESSAGE_COMPONENT
        channel_id: channelId,
        data: {
          component_type: 2, // BUTTON
          custom_id: customId,
        },
      }),
    });
    return res.json();
  }
}

export const DiscordMock = DiscordMockClient;

