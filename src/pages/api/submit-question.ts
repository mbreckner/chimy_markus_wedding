import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
    let name: string, question: string;
    try {
        const body = await context.request.json() as { name?: string; question?: string };
        name = (body.name ?? '').trim();
        question = (body.question ?? '').trim();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }

    if (!name || !question) {
        return new Response(JSON.stringify({ error: 'Name and question are required' }), { status: 400 });
    }

    const apiKey = (context.locals as App.Locals).runtime?.env?.BREVO_API_KEY;
    if (!apiKey) {
        console.error('BREVO_API_KEY is not configured');
        return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 503 });
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sender: { name: 'Wedding Q&A', email: 'mbreckner@yahoo.de' },
            to: [{ email: 'mbreckner@yahoo.de' }],
            subject: `New wedding question from ${name}`,
            htmlContent: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Question:</strong></p>
                <p>${question.replace(/\n/g, '<br>')}</p>
            `,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Brevo error:', err);
        return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 502 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
