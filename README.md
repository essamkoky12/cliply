# Cliply

Cliply is a web application for inspecting supported media sources and trimming media into MP4 or MP3 clips. The Express API and Next.js frontend run independently. The frontend uses Next.js 15.5.28 rather than the originally requested 14.x line because no patched Next.js 14 release addressed the published critical advisories found during implementation. React remains on 18.

## Provider status

| Provider                              | Metadata                                       | Playlist metadata                    | Media acquisition                                         |
| ------------------------------------- | ---------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| Direct HTTP media                     | Bounded HTTP range probing and local `ffprobe` | No                                   | Yes, for supported direct media files                     |
| YouTube                               | yt-dlp extractor metadata and actual formats   | First 50 flat entries through yt-dlp | yt-dlp when that URL is publicly accessible and supported |
| Instagram, TikTok, Facebook, X, Vimeo | yt-dlp extractor metadata when supported       | No                                   | yt-dlp when that URL is publicly accessible and supported |

yt-dlp supports many extractors, but support is not guaranteed for every URL, region, account state, or media type. Private, removed, age-gated, live, DRM-protected, and otherwise restricted sources can fail or be intentionally rejected. Cliply does not use browser cookies/session credentials, bypass access controls, or expose extractor format URLs. The Google YouTube Data API key is not used for media acquisition and does not grant access to media files.

Platform metadata comes from yt-dlp, separately from media acquisition. Metadata responses include only safe format summaries (never signed media URLs); the editor exposes MP4/MP3 only when the extractor reports the required streams. Acquisition uses yt-dlp's native downloaders, a per-operation authenticated egress proxy with DNS/IP validation, and the existing local FFmpeg trim/validation pipeline.

## Requirements

- Node.js 20 or newer and npm.
- FFmpeg and ffprobe installed and available on `PATH`, with the `libx264` and `libmp3lame` encoders.
- yt-dlp installed and available on `PATH` (or configure `YT_DLP_PATH`).
- A JavaScript runtime supported by yt-dlp: Node.js is the default (`YT_DLP_JS_RUNTIME=node`); Deno is optional.

The server checks yt-dlp, the configured JavaScript runtime, FFmpeg, and ffprobe at startup. View the detected versions/status at `GET /api/providers` or `GET /api/providers/dependencies`.

### Windows development

Install Node.js 20+, FFmpeg, and yt-dlp. Use an official yt-dlp Windows executable from its [release page](https://github.com/yt-dlp/yt-dlp/releases) or the official pip package:

```powershell
py -m pip install -U "yt-dlp[default]"
```

Add the executable directories to `PATH`, or set `YT_DLP_PATH`, `FFMPEG_PATH`, and `FFPROBE_PATH` in `server/.env`. Node is the default yt-dlp JavaScript runtime and is passed as an explicit runtime path. Deno can be selected with `YT_DLP_JS_RUNTIME=deno` if installed. Confirm the tools:

```powershell
node --version
yt-dlp --version
ffmpeg -version
ffprobe -version
```

### Linux deployment

Install Node.js 20+, FFmpeg, and a current official yt-dlp build. For example, use the yt-dlp standalone Linux binary from its [official releases](https://github.com/yt-dlp/yt-dlp/releases), place it in `/usr/local/bin/yt-dlp`, and make it executable. The official pip-based alternative is:

```sh
python3 -m pip install --user -U "yt-dlp[default]"
```

Ensure the executable and FFmpeg directories are in the service user's `PATH`, or set their absolute paths in `server/.env`. Install Node.js 20+ from a maintained distribution source; Node is the default yt-dlp JS runtime. Deno is optional. Do not copy browser cookies or session profiles into the service.

## Setup

In one terminal:

```powershell
cd cliply\server
npm install
Copy-Item .env.example .env
npm start
```

In another terminal:

```powershell
cd cliply\web
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The API listens on port `4000` by default. Set `NEXT_PUBLIC_API_URL` in `web/.env.local` if the API runs elsewhere.

## Configuration

Server environment variables are documented in `server/.env.example`. The API validates numeric limits at startup. `MAX_METADATA_PROBE_BYTES` bounds bytes read by `ffprobe` while inspecting a direct-media URL. yt-dlp metadata calls use a limited operation timeout; acquisition jobs use `JOB_TIMEOUT_MS`, `MAX_SOURCE_BYTES`, `MAX_OUTPUT_BYTES`, and `MAX_CONCURRENT_JOBS`. yt-dlp is invoked with argument arrays (never a shell), no user configuration, no playlist downloads, no cookies, and native downloaders. An authenticated loopback proxy validates every outbound destination and redirect against DNS results and blocks loopback/private/reserved/cloud-metadata IP ranges. The proxy pins the validated DNS address for each connection.

Failed yt-dlp acquisitions are logged server-side with the provider, failing stage, process exit code, and a bounded stderr excerpt. URLs and common credential fields are redacted; proxy destination rejections are distinguished from HTTP denials returned by the source.

Temporary source and output files live in `server/storage/<job-id>`. Job identifiers are unguessable UUIDs, responses do not disclose filesystem paths or signed media URLs, active processing is concurrency-limited, and completed outputs expire after `FILE_RETENTION_MS`. Failed and cancelled jobs have their files removed. A successful response is emitted only after the output file has been probed and validated.

## API

- `POST /api/video/info` — `{ "url": "..." }`
- `POST /api/playlists/info` — `{ "url": "..." }`
- `POST /api/video/download` — `{ "url": "...", "startTime": 2, "endTime": 8, "format": "mp4", "quality": "720p", "audioQuality": 192, "resizePreset": "portrait", "resizeMode": "fit", "title": "clip" }` creates one parent job for both formats; `format` selects the initially displayed output. MP3 audio quality accepts 128, 192, 256, or 320 kbps and defaults to 192 kbps; the encoded bitrate is reported in `outputs.mp3.audioBitrate`. Quality accepts `360p`, `480p`, `720p`, `1080p`, or `best` (Best Available), defaulting to `720p`. Resize presets are `original`, `portrait` (1080×1920), `landscape` (1920×1080), `square` (1080×1080), and `feed` (1080×1350); modes are `fit`, `fill`, and `stretch`, defaulting to Original/Fit. The MP4 output reports its actual dimensions in `outputs.mp4.resolution`.
- `GET /api/video/jobs/:id`
- `GET /api/video/jobs/:id/file`
- `GET /api/video/jobs/:id/files/:format` (`mp4` or `mp3`)
- `DELETE /api/video/jobs/:id`
- `GET /api/providers`
- `GET /api/providers/dependencies`
- `GET /health`

Download creation returns `202 Accepted` with one parent job and independent `outputs.mp4` / `outputs.mp3` states. yt-dlp acquires the source once; after source validation, two FFmpeg tasks run concurrently with the same trim timestamps and separate output files. Each output includes its own status, progress, error, expiration, and download URL. A finished output is downloadable while the other is still processing or has failed. The parent becomes completed only after both outputs are terminal, and is failed only when neither output succeeds. Cancelling the parent aborts acquisition and both processing tasks. Poll the parent endpoint until both output states are terminal; errors use a stable `{ "error": { "code": "...", "message": "..." } }` response shape.

## Tests

Run backend tests from `server`:

```powershell
npm test
```

Run frontend polling lifecycle tests from `web`:

```powershell
npm test
```

Job status requests are serialized, start with a 1.5-second delay, and back off to at most five seconds for long-running jobs. Polling stops on terminal states or cancellation. The frontend test suite verifies the backoff, no overlapping/duplicate polls, terminal cleanup, cancellation, and stale-response handling.

The tests generate local deterministic video/audio fixtures with FFmpeg, verify shared acquisition, concurrent output processing, independent completion/failure, parent cancellation, output expiration, and actual MP4/MP3 downloads. They also exercise SSRF and URL checks, authenticated HTTPS CONNECT and proxy cleanup, distinguish proxy blocks from upstream HTTP 403 responses, and (when yt-dlp, Node.js, FFmpeg, and ffprobe are installed) run the actual yt-dlp CLI against the generated fixture through a test-only loopback resolver/proxy and test both output download endpoints. That local generic-extractor test is not a live YouTube integration test. No live platform URL was used for testing, so site-specific success remains dependent on the extractor and the source's access restrictions.

## Responsible use

Only process content you are authorized to access and modify. Cliply does not bypass DRM, authentication, provider restrictions, or other technical protections.
