# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | ✅ Yes             |

Only the latest version of Nexus Gateway receives security updates. Please ensure you are running the most recent release.

## Reporting a Vulnerability

If you discover a security vulnerability in Nexus Gateway, **please do not open a public issue.**

Instead, report it privately:

1. **Email:** Send details to the maintainer through [GitHub private vulnerability reporting](https://github.com/amarisaster/nexus-gateway/security/advisories/new)
2. **Discord:** Contact Amaris directly via Discord (preferred for urgent issues)

### What to Include

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Any suggested fixes (optional but appreciated)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix or mitigation:** Depends on severity, but critical issues are prioritized immediately

## Security Considerations

### This Is a Routing Layer

Nexus Gateway proxies requests to your backend services. It does not store data, manage authentication, or handle secrets beyond what's in your `wrangler.toml` environment variables.

### What You Are Responsible For

- **Backend security.** Nexus forwards requests to your backends as-is. If your backend has no authentication, anyone with your gateway URL can call those tools. Secure your backends independently.
- **Environment variables.** Your `wrangler.toml` contains backend URLs. If any of those URLs include API keys or tokens, treat your `wrangler.toml` as sensitive. Do not commit it to public repositories with secrets included.
- **Cloudflare Workers secrets.** For sensitive values (API keys, tokens), use `wrangler secret put` instead of putting them in `wrangler.toml` as plain text.
- **Access control.** The gateway endpoint is public by default. If you need to restrict access, implement authentication middleware or use Cloudflare Access.

### What Nexus Does NOT Do

- Does not store or log request/response data
- Does not authenticate end users (your backends should handle this)
- Does not encrypt data beyond what HTTPS provides (all Cloudflare Workers traffic is HTTPS by default)
- Does not rate-limit by default (consider adding this if your gateway is public)

### Recommended Practices

1. **Use Cloudflare Workers secrets** for any sensitive environment variables
2. **Keep backend URLs private** — don't expose them in client-side code
3. **Add authentication middleware** if your gateway is publicly accessible and your backends don't have their own auth
4. **Monitor your Cloudflare Workers dashboard** for unexpected traffic patterns
5. **Keep dependencies updated** — run `npm audit` regularly and update when security patches are available
6. **Review the CORS configuration** in your gateway — the default allows all origins (`*`). Restrict this in production if possible

### Dependencies

Nexus relies on:
- `@modelcontextprotocol/sdk` — The official MCP SDK
- `agents` — Cloudflare's agent framework for Durable Objects
- `zod` — Schema validation

Keep these updated. Run `npm audit` periodically to check for known vulnerabilities.

## Disclosure Policy

We follow coordinated disclosure. If you report a vulnerability:
- We will work with you to understand and resolve the issue
- We will credit you in the fix announcement (unless you prefer anonymity)
- We ask that you do not publicly disclose the vulnerability until a fix is available

Thank you for helping keep Nexus Gateway and the companion-building community safe.
