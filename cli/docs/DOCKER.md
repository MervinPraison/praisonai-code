# PraisonAI Code CLI - Docker

A containerized version of the PraisonAI Code CLI with full browser automation support.

## Quick Start Examples

### Build the Image

```bash
pnpm install
pnpm cli:bundle
```

### Debian-based Image

```bash
cd cli
docker build \
  --target debian \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  --build-arg VERSION=$(jq -r '.version' package.json) \
  -t praisonaiai/cli:$(jq -r '.version' package.json) \
  -t praisonaiai/cli:latest \
  .
```

### Alpine-based Image

```bash
cd cli
docker build \
  --target alpine \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  --build-arg VERSION=$(jq -r '.version' package.json) \
  -t praisonaiai/cli:$(jq -r '.version' package.json) \
  -t praisonaiai/cli:latest-alpine \
  .
```

### 1. Basic Interactive Mode

Run the CLI interactively in your current directory:

```bash
docker run -it --rm -v $(pwd):/workspace praisonaiai/cli
```

### 2. Architect Mode

Start in architect mode for planning and design:

```bash
docker run -it --rm -v $(pwd):/workspace praisonaiai/cli --mode architect
```

### 3. One-Shot Autonomous Mode

Execute a single task and exit automatically:

```bash
docker run --rm -v $(pwd):/workspace praisonaiai/cli --auto "Run tests and fix any issues"
```

### 4. With Local Configuration

Mount your existing PraisonAI Code configuration to avoid setup prompts:

```bash
docker run -it --rm \
  -v $(pwd):/workspace \
  -v ~/.praisonaicode:/home/praisonaicode/.praisonaicode \
  praisonaiai/cli
```

---

## Additional Options

### Custom Workspace Path

```bash
docker run -it --rm -v /path/to/project:/workspace praisonaiai/cli
```

### Mount Git Configuration

For commit operations:

```bash
docker run -it --rm \
  -v $(pwd):/workspace \
  -v ~/.praisonaicode:/home/praisonaicode/.praisonaicode \
  -v ~/.gitconfig:/home/praisonaicode/.gitconfig:ro \
  praisonaiai/cli
```

### Environment Variables

```bash
docker run -it --rm \
  -v $(pwd):/workspace \
  -e PRAISONAICODE_MODE=code \
  praisonaiai/cli
```

### With Timeout

```bash
docker run --rm \
  -v $(pwd):/workspace \
  praisonaiai/cli /usr/local/bin/praisonaicode --timeout 300 --auto "Run tests"
```

## Configuration

### Persistent Configuration

The CLI stores configuration in `~/.praisonaicode/config.json`. You can:

**Option 1: Mount local config** (recommended)

```bash
-v ~/.praisonaicode:/home/praisonaicode/.praisonaicode
```

**Option 2: Use Docker volume for isolated config**

```bash
docker volume create praisonaicode-config
docker run -it --rm \
  -v $(pwd):/workspace \
  -v praisonaicode-config:/home/praisonaicode/.praisonaicode \
  praisonaiai/cli
```

### Terminal Colors and Theme

If you experience text visibility issues (text blending with background), you can:

**Option 1: Set theme explicitly in config**

Edit `~/.praisonaicode/config.json`:

```json
{
	"theme": "dark" // or "light" for light terminals
}
```

**Option 2: Force color environment variables**

```bash
docker run -it --rm \
  -v $(pwd):/workspace \
  -e FORCE_COLOR=1 \
  -e COLORTERM=truecolor \
  praisonaiai/cli
```

**Option 3: Pass terminal info**

```bash
docker run -it --rm \
  -v $(pwd):/workspace \
  -e TERM=$TERM \
  praisonaiai/cli
```
