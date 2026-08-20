---
name: Recover from Chrome Aw Snap
description: >-
  Use when Chrome shows Aw Snap (or a similar crash page). Read the error
  message, check it is safe to proceed, then press the blue button.
---
# Recover from Chrome Aw Snap

When Chrome shows **Aw, Snap!** (or the same crash page with a blue action button), do not skip the page. Do not invent a new URL. Recover in place.

## Steps

1. **Read the Aw Snap.** Note the heading, the line under it, and any error code. Also note the URL in the address bar (do not change it yet).
2. **Review the message underneath.** Typical safe text: “Something went wrong while displaying this webpage” plus **Error code: 9**. That is a renderer crash, not a login wall, not a permission denial, not a payment or 2FA prompt.
3. **Decide if it is safe to proceed.** Safe: same site you already meant to be on, crash/reload wording, no password/2FA/captcha/payment. Stop if the message is access denied, sign-in required, a cert/warning you do not understand, or anything that would send credentials.
4. **Double-check contraindications.** Do not Reload if:
   - the tab is a login, SSO, 2FA, captcha, or payment page
   - the message says access denied / 403 / you do not have permission
   - you would be resubmitting a destructive POST you did not mean to
   - the URL is not the page you intended
5. **Press the blue button.** On the demonstrated page that button is **Reload**. Click it once. Wait for the page to come back. Do not click it again while it is loading.

## Demonstrated example

- URL: `https://track.onestepgps.com/v3/ux/map/history/single?device_id=6ix3Ch-tNX9PKF81f07-1V`
- Message: Aw, Snap! / Something went wrong while displaying this webpage. / Error code: 9
- Verdict: safe to Reload (renderer crash on an already-signed-in History tab)
- Action: click **Reload**
- After Reload the `device_id` query dropped and History UI loaded. Then pick the device from the list if needed.

## Report

Say the exact error text, the safety verdict, and that you pressed the blue button (or why you did not).
