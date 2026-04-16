import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/test-notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'cryptoarena1@gmail.com',
      telegram: '123456789' // dummy
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
