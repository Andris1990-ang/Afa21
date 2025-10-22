
# AFA Transfers — Business Site (LV | RU | EN)

Pages: Home, About, Fleet, Tours, Order, Contact
Design: Black & Gold (business)
Deploy: Vercel (static + serverless functions)

## Environment Variables (Vercel → Settings → Environment Variables)
### Resend (email)
- `RESEND_API_KEY`
- `RESEND_FROM` = `AFA Transfers <noreply@afatransfer.lv>`
- `BOOKING_TO` = `amrtransfersgroup@gmail.com`

### Autocomplete & Distance (choose one)
- `MAPBOX_TOKEN` = `pk...`
- or `GOOGLE_PLACES_KEY` = `AIza...`

After adding ENV → Redeploy.

## Edit Content
- Texts / translations: `public/assets/js/i18n.json`
- Styles: `public/assets/css/styles.css`
- Fleet images: `public/assets/images/fleet/`
- Tours images: `public/assets/images/tours/`
- Order logic: `public/assets/js/order.js`
- Email: `api/booking.js`
- Autocomplete: `api/places.js`
- Distance & prices: `api/route.js`
