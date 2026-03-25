// This file exists to trigger Cloudflare Pages Worker mode.
// The actual handler is in src/pages/api/submit-question.ts (Astro API route).
export const onRequestPost: PagesFunction = async () => {
    return new Response(null, { status: 404 });
};
