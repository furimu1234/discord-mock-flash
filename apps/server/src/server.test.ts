// apps/server/src/server.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startDiscordMockServer } from './index.js';
import path from 'node:path';
import fs from 'node:fs';

const TEST_PORT = 3199;
const TEST_DATA_PATH = path.resolve(process.cwd(), 'data', 'test-state.json');

describe('Discord Mock Server & State Store', () => {
  let serverInstance: any;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DATA_PATH)) {
      fs.unlinkSync(TEST_DATA_PATH);
    }
    serverInstance = startDiscordMockServer({
      port: TEST_PORT,
      dataPath: TEST_DATA_PATH,
    });
    // Wait for server to listen
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

  it('GET /api/v10/gateway/bot returns gateway url with local port', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/v10/gateway/bot`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe(`ws://127.0.0.1:${TEST_PORT}/gateway`);
    expect(data.shards).toBe(1);
  });

  it('GET /api/v10/users/@me returns the mock bot user', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/v10/users/@me`);
    expect(res.status).toBe(200);
    const user = await res.json();
    expect(user.bot).toBe(true);
    expect(user.username).toBe('TargetBot');
  });

  it('manages dummy users and active user switching', () => {
    const store = serverInstance.store;
    const initialActive = store.getActiveUser();
    expect(initialActive.username).toBe('Alice');

    // Create Charlie
    const charlie = store.createUser({ username: 'Charlie' });
    expect(charlie.username).toBe('Charlie');

    // Switch to Charlie
    store.setActiveUser(charlie.id);
    expect(store.getActiveUser().id).toBe(charlie.id);
  });

  it('enforces DM isolation by user', () => {
    const store = serverInstance.store;
    const state = store.getState();

    const alice = state.users.find((u: any) => u.username === 'Alice');
    const bob = state.users.find((u: any) => u.username === 'Bob');

    // Alice's DMs
    const aliceDms = state.channels.filter(
      (c: any) => c.type === 1 && c.recipient_ids?.includes(alice.id)
    );
    // Bob's DMs
    const bobDms = state.channels.filter(
      (c: any) => c.type === 1 && c.recipient_ids?.includes(bob.id)
    );

    expect(aliceDms.length).toBeGreaterThan(0);
    expect(bobDms.length).toBeGreaterThan(0);
    expect(aliceDms[0].id).not.toBe(bobDms[0].id);
  });

  it('simulates voice connection and streaming', () => {
    const store = serverInstance.store;
    const bot = store.getState().users.find((u: any) => u.bot);
    const alice = store.getState().users.find((u: any) => u.username === 'Alice');
    const vcChannel = store.getState().channels.find((c: any) => c.type === 2);

    expect(vcChannel).toBeDefined();

    // Bot joins VC
    store.joinVoice(bot.id, vcChannel.id);
    store.setBotStreamingVoice(true, vcChannel.id);

    // Alice joins VC
    store.joinVoice(alice.id, vcChannel.id);

    const activeStates = store.getState().voiceStates.filter((vs: any) => vs.channel_id === vcChannel.id);
    expect(activeStates.length).toBe(2);
    expect(store.getState().botStreamingVoice).toBe(true);

    // Alice leaves VC
    store.leaveVoice(alice.id);
    const afterStates = store.getState().voiceStates.filter((vs: any) => vs.channel_id === vcChannel.id);
    expect(afterStates.length).toBe(1);
  });

  it('serves Web UI with right sidebar containing members and test cases tabs', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('id="rightSidebar"');
    expect(html).toContain('id="tabMembers"');
    expect(html).toContain('id="tabTestCases"');
    expect(html).toContain('id="panelMembers"');
    expect(html).toContain('id="panelTestCases"');
    expect(html).toContain('id="btnRunAllTests"');
  });
});

