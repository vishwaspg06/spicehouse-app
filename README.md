# SpiceHouse application repository

A responsive vegetarian restaurant website with a menu, cart, and practice ordering form. React/Vite frontend, Express API, PostgreSQL, Docker Compose, GHCR, and GitHub Actions. The separate `spicehouse-infra` repository provisions its AWS Ubuntu VM.

## Pipeline

`Git push → API tests and web build → API/web Docker images → GHCR (commit SHA tags) → SSH deploy to EC2 → Compose pull/up → /api/health check`

Pull requests only test and build. Pushes to `main` publish and deploy. See `.github/workflows/ci-cd.yml`.

## Run locally

```bash
cp .env.example .env
# Set DB_PASSWORD to a long random password without URL-special characters.
docker compose up --build -d
curl http://localhost:8080/api/health
curl http://localhost:8080/api/menu
```

Open http://localhost:8080. Orders are saved in PostgreSQL. No payment or fulfilment occurs. Check `docker compose logs -f` if needed. `docker compose down` retains the DB volume; `docker compose down -v` removes it.

## Set up the two GitHub repos

1. Push `spicehouse-infra` to one repo and `spicehouse-app` to another. Follow the infra README to provision EC2 and obtain its public IP. AWS EC2/EBS charges apply.
2. On the VM, wait for cloud-init, reconnect as `ubuntu`, and create `~/spicehouse/.env` with `DB_PASSWORD=...` and `WEB_PORT=8080`. Run `chmod 600 ~/spicehouse/.env`. If GHCR images are private, log Docker into GHCR on the VM once using a GitHub PAT with `read:packages`; alternatively mark both packages public.
3. Add a dedicated deploy SSH public key to the VM's `~/.ssh/authorized_keys`. In the app repo's GitHub secrets set `DEPLOY_KEY` (matching private key), `DEPLOY_USER=ubuntu`, `DEPLOY_HOST` (VM public IP), and `DEPLOY_HOST_KEY` (verified complete known_hosts line for that IP). Check the server fingerprint using a trusted channel before storing the line.
4. Create GitHub environment `production` and optionally require an approval. Push to `main`, inspect Actions, and browse `http://VM_IP:8080`.

GitHub hosted runners use changing source IPs. The infrastructure defaults to narrow SSH access. Use a self-hosted runner with a fixed address, a tunnel/SSM based deployment, or an explicitly controlled temporary access window for CI to SSH. Update `ssh_cidr` accordingly and reapply Terraform before running deployment. The demo site uses HTTP on 8080; add TLS and restrict direct access before public production use.

## API

- `GET /api/health` → API health
- `GET /api/menu` → seeded vegetarian menu
- `POST /api/orders` with `{"customer_name":"Vishwas","item_id":1,"quantity":2}` → saved order line

The UI submits each cart line as a separate order record. If a later request fails, earlier lines may already be saved; the UI warns about this. For a real restaurant, use a single transactional order endpoint, authentication, inventory checks, payments, and customer notifications.

## Troubleshoot and roll back

A failed test blocks publishing. For deployment issues check SSH access, GHCR package visibility, `docker compose ps`, and `docker compose logs --tail=100` on the VM. To roll back, find a known good SHA in Actions or `~/spicehouse/last-deployed.txt`, then run `cd ~/spicehouse && bash remote.sh ghcr.io/OWNER/REPO PREVIOUS_SHA`. Take DB backups before schema changes.

## No-cost local website preview (no Docker needed)

Install Node.js 22 or later. In PowerShell, enter the `spicehouse-app/web` directory and run `npm ci` then `npm run dev`. Open the URL printed by Vite, normally `http://localhost:5173`. The development server supplies sample menu items and accepts simulated orders **in memory only**; they are not stored. The GitHub deployment uses the real API and PostgreSQL.

The deploy job runs only when repository variable `ENABLE_DEPLOY` is set to `true`. Leave it unset while working without AWS. The `publish` job still builds and uploads images to GitHub Container Registry on pushes to main; GitHub package usage may have account-specific limits. Pull requests only run tests and the frontend build.
