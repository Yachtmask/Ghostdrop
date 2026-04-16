import fetch from 'node-fetch';

async function test() {
  const url = 'https://api.testnet.shelby.xyz/shelby/v1/blobs/0xe5d1d799bc5f682b8e31a1cdfd216babe5173422b29a1b7de192388e51173444/ghostdrop_meta_1775393055899.json';
  const res = await fetch(url);
  console.log(res.status);
  if (res.ok) {
    const text = await res.text();
    console.log(text);
  }
}

test();
