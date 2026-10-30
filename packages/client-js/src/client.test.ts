// packages/client-js/src/client.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DiscordMock } from './index.js';
import { startDiscordMockServer } from '../../../apps/server/src/index.js';
import path from 'node:path';
import fs from 'node:fs';

const TEST_PORT = 3198;
const TEST_DATA_PATH = path.resolve(process.cwd(), 'data', 'test-client-state.json');

describe('DiscordMock Client SDK', () => {
  let serverInstance: any;
  let client: DiscordMock;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DATA_PATH)) {
      fs.unlinkSync(TEST_DATA_PATH);
    }
    serverInstance = startDiscordMockServer({
      port: TEST_PORT,
      dataPath: TEST_DATA_PATH,
    });
    client = new DiscordMock({ baseUrl: `http://127.0.0.1:${TEST_PORT}` });
    await new Promise((r) => setTimeout(r, 200));
  });

  afterAll(async () => {
    if (serverInstance?.server) {
      await new Promise<void>((resolve) => serverInstance.server.close(() => resolve()));
    }
    if (fs.existsSync(TEST_DATA_PATH)) {
      fs.unlinkSync(TEST_DATA_PATH);
    }
  });

  it('fetches mock state', async () => {
    const state = await client.getState();
    expect(state.guilds.length).toBeGreaterThan(0);
    expect(state.users.length).toBeGreaterThan(0);
  });

  it('creates dummy users and sends messages as user', async () => {
    const dave = await client.createUser({ username: 'Dave' });
    expect(dave.username).toBe('Dave');

    const state = await client.getState();
    const textChannel = state.channels.find((c: any) => c.type === 0);

    const msg = await client.asUser(dave).sendMessage(textChannel.id, 'Hello from Dave!');
    expect(msg.content).toBe('Hello from Dave!');
    expect(msg.author.username).toBe('Dave');
  });

  it('triggers button interactions', async () => {
    const state = await client.getState();
    const textChannel = state.channels.find((c: any) => c.type === 0);

    const res = await client.clickButton(textChannel.id, 'test_button_1');
    expect(res.id).toBeDefined();
    expect(res.token).toBeDefined();
  });
});
