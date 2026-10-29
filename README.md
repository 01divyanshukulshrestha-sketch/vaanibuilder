# VaaniBuilder

**Describe it. Talk to it. Ship it.**
A no-code platform where anyone can describe a voice AI assistant in plain language, test it live, refine it, deploy it on web or phone, and monitor its calls. Powered by ElevenLabs.

Team: UDTA TEER  · Build Arena Hackathon, Problem Statement 2
Demo video: [link] · Pitch deck: [link]

![Test console screenshot](docs/test-console.png)

## The problem
Clinic owners, restaurant managers, NGOs and small businesses know what a phone conversation should look like, but they can't build a voice agent. VaaniBuilder turns one sentence into a working, testable voice agent.

## How it works
1. **Write:** describe the assistant or pick a starter (Appointments, Lead Generation, Support, Negotiation, Collections). You can also speak the prompt.
2. **Test:** talk to the agent in the browser with a live transcript. You can interrupt it.
3. **Refine:** ask for changes in chat ("make it warmer", "add Hindi") or edit the form.
4. **Deploy:** share a link or embed the widget.
5. **Observe:** review calls, transcripts and summaries.

## Architecture
```
Browser (public/index.html)
   │  REST                         ▲ voice (signed URL, direct)
   ▼                               │
Node + Express (server.js) ──► ElevenLabs
   │  keeps the API key           Agents · TTS · Scribe STT · Voices
   │  server-side                 Knowledge base · Conversations
   └──► optional LLM for generating the agent config
```
The browser never sees the API key. The server creates the agent, hands the browser a short-lived signed URL, and reads call history for the dashboard.

## ElevenLabs features used
| Feature | Where |
|---|---|
| ElevenLabs Agents (real-time voice, interruption) | Test tab via signed URL; Deploy widget |
| Text to Speech (`eleven_flash_v2` for English, `eleven_flash_v2_5` for Hindi) | Agent voice |
| Speech to Text (Scribe) | "Speak it" button on the prompt box |
| Voice library with filter and preview | Create tab |
| Knowledge base (text) | "Knowledge" box, attached to the agent |
| Conversation history, transcripts, summaries | Dashboard |

## Run it
Requires Node 20.6 or newer and an ElevenLabs API key.
```
npm install
cp .env.example .env    # then add ELEVENLABS_API_KEY
npm start               # http://localhost:3000
```
Allow microphone access in the browser. The key needs access to Agents, Voices and Speech to Text. `ANTHROPIC_API_KEY` is optional and enables LLM-based agent generation.

## Responsible AI
- The agent says it is an AI assistant in its welcome message.
- The generator is instructed to refuse scam, impersonation or other deceptive agents.
- No voice cloning is included.
- Call transcripts are stored by ElevenLabs. Tell callers they are being transcribed.

## Status against the brief
| Requirement | Status |
|---|---|
| Prompt box, character limit, examples, 5 starters | [Working / Untested] |
| ElevenLabs agents, TTS, STT, voice picker | [ working ] |
| Live test with transcript, latency, interruption | [ ] (latency is measured in the browser) |
| Chat edit and form editor | [ ] (chat edit is rule-based) |
| Share link and widget | [ ] |
| Phone | Simulated flow; real numbers can be imported from Twilio in the ElevenLabs dashboard |
| Call list, summaries, metrics | [ working ] |
| Hindi, knowledge base | [working ] |
| Human hand-off | Prompt-based and flagged on the dashboard, not a live transfer |
| Not built | Voice cloning, simulated callers, bulk campaigns, caller memory, tool actions |

## Known limitations
The agent id and edits live in browser memory, so a refresh creates a new agent. Not load-tested.
