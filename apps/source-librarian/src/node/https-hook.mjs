export async function load(url, context, nextLoad) {
  if (url.startsWith('https://')) {
    const res = await fetch(url);
    return {
      format: 'module',
      shortCircuit: true,
      source: await res.text()
    }
  }

  return nextLoad(url);
}
