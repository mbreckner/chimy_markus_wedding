interface Env {
    KV: KVNamespace;
}

const VALID_SECTIONS = ['lusaka', 'serengeti', 'ngorongoro', 'zanzibar'];
const VALID_STATUSES = ['count_me_in', 'still_deciding'];

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    const url = new URL(request.url);
    const section = url.searchParams.get('section');

    if (!section || !VALID_SECTIONS.includes(section)) {
        return json({ error: 'Invalid or missing section' }, 400);
    }

    const KV = env.KV;
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
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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

    const KV = env.KV;
    if (!KV) return json({ error: 'KV not configured' }, 503);

    const key = `votes:${section}:${name.trim()}`;
    await KV.put(key, status);

    return json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
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

    const KV = env.KV;
    if (!KV) return json({ error: 'KV not configured' }, 503);

    const key = `votes:${section}:${name.trim()}`;
    await KV.delete(key);

    return json({ ok: true });
};
