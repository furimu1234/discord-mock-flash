"""Discord Mock Client SDK for Python."""

from typing import Any, Dict, Optional
import httpx

class DiscordMockClient:
    def __init__(self, base_url: str = "http://127.0.0.1:3000"):
        self.base_url = base_url.rstrip("/")
        self._active_user_id: Optional[str] = None
        self._client = httpx.AsyncClient(base_url=self.base_url)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self._client.aclose()

    def as_user(self, user_or_id: Any) -> "DiscordMockClient":
        clone = DiscordMockClient(base_url=self.base_url)
        clone._client = self._client
        clone._active_user_id = user_or_id.get("id") if isinstance(user_or_id, dict) else str(user_or_id)
        return clone

    async def get_state(self) -> Dict[str, Any]:
        resp = await self._client.get("/api/mock/state")
        resp.raise_for_status()
        return resp.json()

    async def reset_state(self) -> Dict[str, Any]:
        resp = await self._client.post("/api/mock/reset")
        resp.raise_for_status()
        return resp.json()

    async def create_user(self, username: str, discriminator: str = "0000", bot: bool = False) -> Dict[str, Any]:
        resp = await self._client.post("/api/mock/users", json={
            "username": username,
            "discriminator": discriminator,
            "bot": bot,
        })
        resp.raise_for_status()
        return resp.json()

    async def create_channel(self, name: str, channel_type: int = 0, guild_id: Optional[str] = None) -> Dict[str, Any]:
        resp = await self._client.post("/api/mock/channels", json={
            "name": name,
            "type": channel_type,
            "guild_id": guild_id,
        })
        resp.raise_for_status()
        return resp.json()

    async def send_message(self, channel_id: str, content: str) -> Dict[str, Any]:
        if self._active_user_id:
            await self._client.post("/api/mock/switch-user", json={"userId": self._active_user_id})
        resp = await self._client.post(f"/api/v10/channels/{channel_id}/messages", json={
            "content": content,
        })
        resp.raise_for_status()
        return resp.json()

    async def click_button(self, channel_id: str, custom_id: str) -> Dict[str, Any]:
        if self._active_user_id:
            await self._client.post("/api/mock/switch-user", json={"userId": self._active_user_id})
        resp = await self._client.post("/api/mock/interact", json={
            "type": 3,
            "channel_id": channel_id,
            "data": {
                "component_type": 2,
                "custom_id": custom_id,
            }
        })
        resp.raise_for_status()
        return resp.json()

DiscordMock = DiscordMockClient

