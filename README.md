# VaaniBuilder

Describe a voice agent in plain language, then test, refine, deploy and monitor it. Powered by ElevenLabs.

## Run
```
npm install
cp .env.example .env   # add ELEVENLABS_API_KEY (ANTHROPIC_API_KEY is optional)
npm start              # http://localhost:3000  (Node 20.6+)
```
Allow microphone access. Your key needs access to Agents, Voices and Speech to Text.

## ElevenLabs features used
| Feature | Where |
|---|---|
| ElevenLabs Agents (real-time voice, interruption) | Test tab via signed URL; Deploy widget |
| Text to Speech (`eleven_flash_v2_5`) | Agent voice |
| Speech to Text (Scribe) | "Speak it" button on the prompt box |
| Voice library, filter and preview | Create tab |
| Knowledge base (text) | "Knowledge" box, attached to the agent |
| Conversation history, transcripts, summaries | Dashboard |

## Brief checklist (Problem Statement 2)
| Requirement | Status |
|---|---|
| Prompt box, char limit, examples, 5 starters (4.1) | Done |
| ElevenLabs agents, TTS, STT, voice picker (4.2) | Done |
| Live test, transcript, latency, interruption (4.3) | Done (latency = browser-measured) |
| Chat edit + form editor (4.4) | Done (chat edit is rule-based) |
| Share link, widget, phone demo (4.5) | Link + widget done; phone is a simulated flow, see below |
| Call list, summaries, metrics (4.6) | Done |
| API keys server-side; AI disclosure; no cloning | Done |
| Bonus: hindi, KB, hand-off | Hindi via Flash v2.5 + prompt, KB done, hand-off is prompt-based |
| Not built | Voice cloning, simulated callers, campaigns, memory, tool actions |

## Phone
In the ElevenLabs dashboard, import a Twilio number and assign it to the agent id shown on the Deploy tab. Without a number, use the simulated flow described on that tab.

## Known gaps
Agent id and edits live in memory (refresh = new agent). Not load-tested. Verify model and field names against current ElevenLabs docs.
