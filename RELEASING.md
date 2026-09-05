# Releasing wrikka-mobile

## Local Build

```bash
bun install
bun run build:spa
bunx cap sync android
cd android
./gradlew bundleRelease
```

The AAB is at `android/app/build/outputs/bundle/release/app-release.aab`.

## Signing

Keystore: `android/app/wrikka-mobile-upload.keystore`
Properties: `android/app/keystore.properties` (not committed)
Template: `android/app/keystore.properties.template`

For Play Store, use the upload keystore. Google Play will manage the final app signing key.

## Play Store Deployment

### Manual

1. Open https://play.google.com/console
2. Create app with package name `com.wrikka.mobile`
3. Go to `Release > Production > Create new release`
4. Upload `app-release.aab`
5. Add release notes, set privacy policy to `https://wrikka-mobile.workers.dev/privacy-policy.html`
6. Complete app listing and content rating
7. Review and publish

### Automated (GitHub Actions)

1. Create a Google Play service account:
   - Open https://play.google.com/console
   - Go to `Setup > API access`
   - Link a Google Cloud project if not already done
   - Click `Create service account` and follow the steps
   - Grant the service account `Release Manager` role
   - Download the JSON key
2. Add GitHub secrets in `newkub/wrikka-mobile`:
   - `PLAY_STORE_SERVICE_ACCOUNT_JSON` — paste the full JSON key
   - `SIGNING_KEYSTORE_BASE64` — base64 of `wrikka-mobile-upload.keystore`
   - `SIGNING_STORE_PASSWORD`
   - `SIGNING_KEY_PASSWORD`
   - `SIGNING_KEY_ALIAS` (`wrikka-mobile`)
3. Trigger workflow: `.github/workflows/playstore.yml`

To get base64 of the keystore:

```bash
cd android/app
base64 -w 0 wrikka-mobile-upload.keystore
```

## Widget

The app ships with a clock home screen widget. Add it from the Android launcher after install.
