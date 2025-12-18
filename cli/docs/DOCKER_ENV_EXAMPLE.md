# Docker Environment Variable Example

This document demonstrates how to run PraisonAI Code CLI in a Docker container using only environment variables, without requiring a config.json file.

## Dockerfile Example

```dockerfile
FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache git

# Install PraisonAI Code CLI globally
RUN npm install -g @praisonaicode/cli

# Set working directory
WORKDIR /workspace

# Environment variables will be passed at runtime
# No config.json needed!

# Default command
CMD ["praisonaicode"]
```

## Docker Compose Example

```yaml
version: "3.8"

services:
    praisonaicode:
        build: .
        environment:
            # Core settings
            KILO_MODE: code
            KILO_TELEMETRY: "false"
            KILO_THEME: dark

            # Provider configuration (Praisonaicode)
            KILO_PROVIDER_TYPE: praisonaicode
            PRAISONAICODE_TOKEN: ${PRAISONAICODE_TOKEN}
            PRAISONAICODE_MODEL: x-ai/grok-code-fast-1

            # Auto-approval settings for CI/CD
            KILO_AUTO_APPROVAL_ENABLED: "true"
            KILO_AUTO_APPROVAL_READ_ENABLED: "true"
            KILO_AUTO_APPROVAL_WRITE_ENABLED: "true"
            KILO_AUTO_APPROVAL_EXECUTE_ENABLED: "true"
            KILO_AUTO_APPROVAL_EXECUTE_ALLOWED: "ls,cat,echo,pwd,npm,yarn,git"

        volumes:
            - ./workspace:/workspace
        stdin_open: true
        tty: true
```

## Running with Docker

### Option 1: Using docker run

```bash
docker run -it \
  -e KILO_PROVIDER_TYPE=praisonaicode \
  -e PRAISONAICODE_TOKEN=your-api-token \
  -e PRAISONAICODE_MODEL=your-model-name \
  -e KILO_MODE=code \
  -e KILO_TELEMETRY=false \
  -v $(pwd):/workspace \
  praisonaicode/cli
```

### Option 2: Using docker-compose

```bash
# Set your token in .env file
echo "PRAISONAICODE_TOKEN=your-api-token" > .env

# Start the container
docker-compose up -d

# Execute commands
docker-compose exec praisonaicode praisonaicode "Create a hello world app"
```

### Option 3: Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
    name: praisonaicode-config
data:
    KILO_MODE: "code"
    KILO_TELEMETRY: "false"
    KILO_THEME: "dark"
    KILO_PROVIDER_TYPE: "praisonaicode"
    PRAISONAICODE_MODEL: "x-ai/grok-code-fast-1"
    KILO_AUTO_APPROVAL_ENABLED: "true"
    KILO_AUTO_APPROVAL_READ_ENABLED: "true"
    KILO_AUTO_APPROVAL_WRITE_ENABLED: "true"
    KILO_AUTO_APPROVAL_EXECUTE_ENABLED: "true"
---
apiVersion: v1
kind: Secret
metadata:
    name: praisonaicode-secrets
type: Opaque
stringData:
    PRAISONAICODE_TOKEN: your-api-token-here
---
apiVersion: v1
kind: Pod
metadata:
    name: praisonaicode
spec:
    containers:
        - name: praisonaicode
          image: praisonaicode/cli:latest
          envFrom:
              - configMapRef:
                    name: praisonaicode-config
              - secretRef:
                    name: praisonaicode-secrets
          volumeMounts:
              - name: workspace
                mountPath: /workspace
    volumes:
        - name: workspace
          emptyDir: {}
```

## CI/CD Pipeline Examples

### GitHub Actions

```yaml
name: PraisonAI Code CI

on: [push]

jobs:
    code-review:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3

            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: "20"

            - name: Install PraisonAI Code CLI
              run: npm install -g @praisonaicode/cli

            - name: Run PraisonAI Code
              env:
                  KILO_PROVIDER_TYPE: praisonaicode
                  PRAISONAICODE_TOKEN: ${{ secrets.PRAISONAICODE_TOKEN }}
                  PRAISONAICODE_MODEL: x-ai/grok-code-fast-1
                  KILO_MODE: code
                  KILO_TELEMETRY: false
                  KILO_AUTO_APPROVAL_ENABLED: true
                  KILO_AUTO_APPROVAL_READ_ENABLED: true
                  KILO_AUTO_APPROVAL_WRITE_ENABLED: true
              run: |
                  praisonaicode --auto "Review the code changes in this PR"
```

### GitLab CI

```yaml
praisonaicode-review:
    image: node:20-alpine
    before_script:
        - npm install -g @praisonaicode/cli
    script:
        - praisonaicode --auto "Review the code changes"
    variables:
        KILO_PROVIDER_TYPE: "praisonaicode"
        PRAISONAICODE_TOKEN: $PRAISONAICODE_TOKEN
        KILO_MODE: "code"
        KILO_TELEMETRY: "false"
        KILO_AUTO_APPROVAL_ENABLED: "true"
        KILO_AUTO_APPROVAL_READ_ENABLED: "true"
        KILO_AUTO_APPROVAL_WRITE_ENABLED: "true"
```

### Jenkins Pipeline

```groovy
pipeline {
    agent {
        docker {
            image 'node:20-alpine'
        }
    }

    environment {
        KILO_PROVIDER_TYPE = 'praisonaicode'
        PRAISONAICODE_TOKEN = credentials('praisonaicode-token')
        PRAISONAICODE_MODEL = 'x-ai/grok-code-fast-1'
        KILO_MODE = 'code'
        KILO_TELEMETRY = 'false'
        KILO_AUTO_APPROVAL_ENABLED = 'true'
        KILO_AUTO_APPROVAL_READ_ENABLED = 'true'
        KILO_AUTO_APPROVAL_WRITE_ENABLED = 'true'
    }

    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g @praisonaicode/cli'
            }
        }

        stage('Code Review') {
            steps {
                sh 'praisonaicode --auto "Review the code changes"'
            }
        }
    }
}
```

## Testing Ephemeral Configuration

To test that the CLI works without config.json:

```bash
# 1. Remove any existing config
rm -rf ~/.praisonaicode/cli/config.json

# 2. Set environment variables
export KILO_PROVIDER_TYPE=praisonaicode
export PRAISONAICODE_TOKEN=your-token-here
export PRAISONAICODE_MODEL=your-model-name
export KILO_MODE=code

# 3. Run the CLI
praisonaicode --help

# 4. Verify it works without creating config.json
ls ~/.praisonaicode/cli/config.json  # Should not exist in ephemeral mode
```

## Security Best Practices

1. **Never commit secrets**: Use secret management tools
2. **Use secret managers**:
    - AWS Secrets Manager
    - HashiCorp Vault
    - Kubernetes Secrets
    - GitHub Secrets
3. **Rotate tokens regularly**: Set up automated rotation
4. **Limit permissions**: Use least-privilege access
5. **Audit access**: Monitor who accesses secrets

## Troubleshooting

### Issue: CLI still prompts for auth wizard

**Solution**: Ensure you have set `KILO_PROVIDER_TYPE` and the required credentials for that provider.

```bash
# Check what's missing
export KILO_PROVIDER_TYPE=praisonaicode
# CLI will tell you what environment variables are missing
```

### Issue: Configuration not being picked up

**Solution**: Verify environment variables are set correctly:

```bash
# List all KILO_* environment variables
env | grep KILO

# Check specific variables
echo $KILO_PROVIDER_TYPE
echo $PRAISONAICODE_TOKEN
```

### Issue: Config file being created in ephemeral mode

**Solution**: Set `KILO_EPHEMERAL_MODE=true` to prevent file creation:

```bash
export KILO_EPHEMERAL_MODE=true
```

## Complete Example

Here's a complete working example for a Docker container:

```bash
#!/bin/bash

# Build the Docker image
docker build -t praisonaicode-ephemeral .

# Run with environment variables only
docker run -it --rm \
  -e KILO_PROVIDER_TYPE=praisonaicode \
  -e PRAISONAICODE_TOKEN=${PRAISONAICODE_TOKEN} \
  -e PRAISONAICODE_MODEL=your-model-name \
  -e KILO_MODE=code \
  -e KILO_TELEMETRY=false \
  -e KILO_THEME=dark \
  -e KILO_AUTO_APPROVAL_ENABLED=true \
  -e KILO_AUTO_APPROVAL_READ_ENABLED=true \
  -e KILO_AUTO_APPROVAL_WRITE_ENABLED=true \
  -e KILO_AUTO_APPROVAL_EXECUTE_ENABLED=true \
  -e KILO_AUTO_APPROVAL_EXECUTE_ALLOWED="ls,cat,echo,pwd,npm,git" \
  -v $(pwd):/workspace \
  praisonaicode-ephemeral \
  praisonaicode --auto "Create a simple Node.js hello world app"
```

This will run PraisonAI Code CLI in a completely ephemeral environment without any persistent configuration files.
