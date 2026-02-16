# SATFSW Lab

A complete monorepo for satellite flight software simulation, consisting of:

1. **sat_core** (C++) — Deterministic 10 Hz satellite flight software simulator  
2. **gateway** (Node.js + TypeScript) — UDP telemetry ingest, WebSocket broadcast, REST command API  
3. **dashboard** (Next.js + TypeScript) — Futuristic mission-control UI with live telemetry, commands, and fault injection  

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SATFSW Lab Architecture                         │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────┐
                    │         sat_core (C++)            │
                    │  • 10 Hz deterministic loop       │
                    │  • CLOCK_MONOTONIC + nanosleep    │
                    │  • Sensors, attitude, faults      │
                    └───────────────┬──────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        │
   ┌───────────────┐        ┌───────────────┐               │
   │  UDP telemetry │        │ TCP commands  │               │
   │  127.0.0.1:   │        │  127.0.0.1:   │               │
   │    9001       │        │    9000       │               │
   └───────┬───────┘        └───────┬───────┘               │
           │                        │                        │
           ▼                        ▼                        │
   ┌─────────────────────────────────────────────────────────┐
   │                   gateway (Node.js)                      │
   │  • UDP server 0.0.0.0:9001 (ingest)                     │
   │  • WebSocket ws://127.0.0.1:4000/ws (broadcast)         │
   │  • REST GET /api/status, POST /api/command              │
   └───────────────────────────┬─────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Browser (dashboard) │
                    │   Next.js :3000       │
                    │   • Mission Control   │
                    │   • Console           │
                    │   • Fault Lab         │
                    └──────────────────────┘

Data Flow:
  UDP (9001): sat_core → gateway  (JSON telemetry, one frame per cycle)
  TCP (9000): gateway  → sat_core (newline-delimited commands)
  WS (4000):  gateway  → browser  (live telemetry stream)
  REST (4000): browser → gateway  (commands, status)
```

---

## Run Locally

### Prerequisites

- **Linux** (for sat_core; uses `clock_nanosleep` and `CLOCK_MONOTONIC`)
- **GCC** with C++17
- **Node.js** 20+
- **npm** or **pnpm**

### 1. Build and run sat_core

```bash
cd sat_core
make
./sat_core
```

Optional ASAN build for memory debugging:

```bash
make asan
./sat_core
```

sat_core will:

- Listen for commands on TCP `127.0.0.1:9000`
- Send telemetry on UDP `127.0.0.1:9001`
- Run a 10 Hz control loop with deterministic timing

### 2. Run gateway

```bash
cd gateway
npm install   # or: pnpm install
npm run dev  # or: pnpm dev
```

Gateway will:

- Listen for UDP telemetry on `0.0.0.0:9001`
- Serve WebSocket on `ws://127.0.0.1:4000/ws`
- Serve REST API on `http://127.0.0.1:4000`
- Connect to sat_core on `127.0.0.1:9000` for commands

### 3. Run dashboard

```bash
cd dashboard
npm install   # or: pnpm install
npm run dev  # or: pnpm dev
```

Open **http://localhost:3000** for the mission control UI.

---

## Example Commands

Send commands via the Console page or REST:

```bash
# Basic
PING
SET_MODE NOMINAL
SET_MODE SAFE
RESET_FAULTS
STATS

# Attitude
SET_TARGET_RATE 0.1 0 -0.05

# Fault injection
INJECT CPU_LOAD 80 5
INJECT SENSOR_DROPOUT 3
INJECT GYRO_SPIKE 8 2
INJECT POWER_GLITCH 12 1
```

REST example:

```bash
curl -X POST http://127.0.0.1:4000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command": "PING"}'
```

---

## Fault Injection Scenarios

| Scenario | Command | Effect |
|----------|---------|--------|
| **CPU overload → SAFE** | `INJECT CPU_LOAD 85 10` | Busy-waits 85ms per cycle → deadline misses → SAFE after 3 consecutive |
| **Star tracker dropout** | `INJECT SENSOR_DROPOUT 5` | Gyro + star tracker unavailable for 5s; attitude propagates only |
| **Watchdog trigger** | `INJECT CPU_LOAD 95 5` | Heavy load delays heartbeat; watchdog (>250ms) sets WATCHDOG fault → SAFE |

---

## Data Flow Summary

| Path | Protocol | Direction | Content |
|------|----------|-----------|---------|
| Telemetry | UDP :9001 | sat_core → gateway | JSON lines (one per cycle) |
| Commands | TCP :9000 | gateway → sat_core | Newline-delimited text |
| Telemetry to browser | WebSocket :4000/ws | gateway → browser | JSON frames |
| Commands from browser | REST POST :4000/api/command | browser → gateway | `{"command":"..."}` |
| Status | REST GET :4000/api/status | browser → gateway | Latest telemetry JSON |

---

## Telemetry Schema

Each UDP/WS frame is a JSON object with:

| Field | Type | Description |
|-------|------|-------------|
| ts_monotonic_ns | number | Monotonic timestamp (ns) |
| cycle_id | number | Cycle index |
| cycle_ms | number | Cycle duration (ms) |
| slack_ms | number | Remaining budget (100 - cycle_ms) |
| deadline_miss | boolean | This cycle exceeded 100ms |
| deadline_miss_total | number | Cumulative misses |
| consecutive_miss | number | Consecutive misses (triggers SAFE at 3) |
| mode | string | NOMINAL \| SAFE |
| faults_bitmask | number | Bitmask of active faults |
| faults_list | string[] | Human-readable fault names |
| attitude | object | Quaternion {w,x,y,z} |
| rates_xyz | [number,number,number] | deg/s |
| sensor_status | object | gyro_ok, star_tracker_ok, last_update_ms |
| telemetry_drops | number | Dropped frames |
| command_queue_depth | number | Pending commands |
| last_command | string | Last executed command |

---

## Project Structure

```
satfsw-lab/
├── sat_core/           # C++ flight software simulator
│   ├── src/
│   │   ├── main.cpp
│   │   ├── config.hpp
│   │   ├── logger.hpp
│   │   ├── faults.hpp/cpp
│   │   ├── mode.hpp
│   │   ├── sensors.hpp/cpp
│   │   ├── attitude.hpp/cpp
│   │   ├── command.hpp/cpp
│   │   ├── telemetry.hpp/cpp
│   │   ├── udp_sender.hpp
│   │   └── tcp_server.hpp/cpp
│   ├── tests/
│   └── Makefile
├── gateway/            # Node.js bridge
│   ├── src/
│   │   ├── index.ts
│   │   ├── udp-server.ts
│   │   ├── tcp-client.ts
│   │   ├── ws-broadcast.ts
│   │   └── types.ts
│   └── package.json
├── dashboard/          # Next.js UI
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── lib/
│   └── package.json
├── package.json        # pnpm workspace root
├── pnpm-workspace.yaml
└── README.md
```

---

## Determinism & Timing

- **10 Hz loop**: 100 ms period
- **Linux**: Uses `clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, ...)` for absolute-time sleep
- **macOS/other**: Falls back to `std::this_thread::sleep_until`
- **Bounded work**: At most 5 commands processed per cycle (configurable)
- **Deadline enforcement**: If `cycle_ms > 100`, counts as deadline miss; 3 consecutive → SAFE mode

---

## License

MIT
