const INDEX_PATH = '/index.html';

export default {
  async fetch(request, env) {
    if (!env.ASSETS) {
      return new Response('Static asset binding is unavailable.', { status: 500 });
    }

    let response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);

    if (
      response.status === 404 &&
      request.method === 'GET' &&
      !url.pathname.split('/').at(-1)?.includes('.')
    ) {
      const indexUrl = new URL(INDEX_PATH, url);
      response = await env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return response;
  },
};
