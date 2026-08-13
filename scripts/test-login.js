(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'CHEMISTRY@2026' }),
    });
    console.log('status', res.status);
    console.log('headers:');
    for (const [k, v] of res.headers) console.log(k + ':', v);
    const text = await res.text();
    console.log('body:', text);
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const cookie = setCookie.split(';')[0];
      const res2 = await fetch('http://localhost:3000/api/admin/students', {
        headers: { Cookie: cookie }
      });
      console.log('\nGET /api/admin/students status', res2.status);
      const body2 = await res2.text();
      console.log('body:', body2.substring(0, 1000));
    }
  } catch (err) {
    console.error('fetch error', err);
  }
})();
