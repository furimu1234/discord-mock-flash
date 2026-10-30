# Discord Mock Python Client (`discord-mock-client`)

Discord Mock サーバーを Python (pytest / asyncio) から操作・アサートするためのクライアントSDKです。

```python
import pytest
from discord_mock_client import DiscordMock

@pytest.mark.asyncio
async def test_bot_interaction():
    async with DiscordMock("http://127.0.0.1:3000") as mock:
        user = await mock.create_user(username="Alice")
        await mock.as_user(user).send_message(channel_id="...", content="Hello")
```
