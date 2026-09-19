# Threadline Store: Client Brief

**Client:** Threadline Handlooms, Jaipur. Contact: Rohini Malhotra, Founder.
**Team:** Ananya Pawar (frontend), Rukhsar Shaikh (backend). Mentor: Sunita Deshmukh.

Threadline sells handloom clothing from weavers around Jaipur. Orders currently come through Instagram and WhatsApp with UPI screenshots. Rohini wants an online store she can run herself.

## Goals
- Let customers browse, add to cart and pay online without messaging the team.
- Let Rohini and her assistant add products and see orders without a developer.
- Give Rohini a "modern dashboard with analytics" so she can understand the business.

## Deliverables
- Storefront: home page, category pages, product cards, cart, checkout, order success and cancel pages.
- Customer signup and login.
- Coupon codes for repeat customers.
- Admin area: create product, product list with featured toggle, analytics tab.
- Deployed site with a handover document.

## Agreed scope
- Stack: React (Vite) frontend, Express API, MongoDB, Redis for caching and refresh tokens, Stripe Checkout for payments, Cloudinary for product images.
- Login uses JWT access and refresh tokens stored in httpOnly cookies.
- Payment uses Stripe hosted Checkout. The order is created when the customer lands on the success page after payment.
- One admin role. Admin accounts are created directly in the database.
- Around 60 products in six categories. The client supplies content.
- Analytics tab in the admin area. The client has asked for a "modern dashboard with analytics"; the exact figures and charts are not listed yet.

## Out of scope
- Mobile app.
- Shipping partner integration and live tracking.
- GST invoices and accounting exports.
- Multiple languages, multiple currencies, reviews, wishlists.

## Timeline and milestones
- 20 July 2026: project start.
- 14 August 2026: storefront and cart demo.
- 11 September 2026: checkout, coupons and admin product management.
- 26 September 2026: analytics tab and first full review.
- 3 October 2026: client testing on staging.
- 10 October 2026: launch and handover.

## Client preferences
- Colours: off-white background, deep indigo as the main colour, a mustard accent. No bright red.
- Large product photos, little text, boutique feel.
- Must launch before the Diwali season.
- Prefers WhatsApp and a weekly Saturday call. Slow on email.
- Not technical. Explain choices in terms of what the customer sees.

## Access and credentials
- Stripe: client-owned account in test mode. Test keys are in the team vault. The client adds live keys in launch week.
- Cloudinary, MongoDB Atlas, Upstash Redis: free-tier accounts created by the team, to be transferred at handover. Connection strings exist only in local `.env` files and the hosting dashboard.
- Domain: owned by the client. Registrar access not shared yet.
- `.env.example` lists variable names only. No values are committed.
