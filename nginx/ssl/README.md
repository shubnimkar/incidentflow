# SSL Certificates

This directory contains SSL certificates for HTTPS configuration.

## Development Setup

For development, you can create self-signed certificates:

```bash
# Create self-signed certificate for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Production Setup

For production, you should use proper SSL certificates from:
- Let's Encrypt (free)
- Your certificate authority
- Cloud provider (AWS Certificate Manager, etc.)

## File Structure

- `cert.pem` - SSL certificate
- `key.pem` - Private key
- `ca-bundle.pem` - Certificate authority bundle (if needed)

## Security Note

Never commit real SSL private keys to version control!
Add them to `.gitignore` for security.