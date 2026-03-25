import type { APIContext } from 'astro';

export const prerender = false;

const VALID_SECTIONS = ['lusaka', 'serengeti', 'ngorongoro', 'zanzibar'];
const VALID_STATUSES = ['count_me_in', 'still_deciding'];

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function GET({ request, locals }: APIContext) {
    const url = new URL(request.url);
    const section = url.searchParams.get('section');

    if (!section || !VALID_SECTIONS.includes(section)) {
        return json({ error: 'Invalid or missing section' }, 400);
    }

    const KV = (locals as any).runtime?.env?.KV;
    if (!KV) return json({ error: 'KV not configured' }, 503);

    const prefix = `votes:${section}:`;
    const list = await KV.list({ prefix });

    const votes = await Promise.all(
        list.keys.map(async (key: { name: string }) => {
            const name = key.name.slice(prefix.length);
            const status = await KV.get(key.name);
            return { name, status };
        })
    );

    return json(votes);
}

export async function POST({ request, locals }: APIContext) {
    let body: { section?: string; name?: string; status?: string };
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid JSON' }, 400);
    }

    const { section, name, status } = body;

    if (!section || !VALID_SECTIONS.includes(section)) {
        return json({ error: 'Invalid or missing section' }, 400);
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
        return json({ error: 'Invalid or missing name' }, 400);
    }
    if (!status || !VALID_STATUSES.includes(status)) {
        return json({ error: 'Invalid or missing status' }, 400);
    }

    const KV = (locals as any).runtime?.env?.KV;
    if (!KV) return json({ error: 'KV not configured' }, 503);

    const key = `votes:${section}:${name.trim()}`;
    await KV.put(key, status);

    return json({ ok: true });
}

export async function DELETE({ request, locals }: APIContext) {
    let body: { section?: string; name?: string };
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid JSON' }, 400);
    }

    const { section, name } = body;

    if (!section || !VALID_SECTIONS.includes(section)) {
        return json({ error: 'Invalid or missing section' }, 400);
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
        return json({ error: 'Invalid or missing name' }, 400);
    }

    const KV = (locals as any).runtime?.env?.KV;
    if (!KV) return json({ error: 'KV not configured' }, 503);

    const key = `votes:${section}:${name.trim()}`;
    await KV.delete(key);

    return json({ ok: true });
}
