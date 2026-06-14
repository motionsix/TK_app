import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://api.loyverse.com/v1.0';

export function loyverseToken() {
  return (process.env.LOYVERSE_TOKEN || '').trim();
}

export function isConfigured() {
  return loyverseToken().length > 0;
}

async function lvFetch(path, { params = {}, method = 'GET', body } = {}) {
  const token = loyverseToken();
  if (!token) {
    const err = new Error('ยังไม่ได้ตั้งค่า LOYVERSE_TOKEN ในไฟล์ .env');
    err.status = 400;
    throw err;
  }

  const url = new URL(BASE_URL + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(
      data?.errors?.[0]?.details ||
        data?.message ||
        `Loyverse API ตอบกลับ ${res.status}`
    );
    err.status = res.status === 401 ? 401 : 502;
    throw err;
  }
  return data;
}

// Follow Loyverse's cursor-based pagination until all records are collected.
async function paginate(path, listKey, params = {}) {
  const all = [];
  let cursor;
  let guard = 0;
  do {
    const data = await lvFetch(path, { params: { limit: 250, cursor, ...params } });
    const list = data[listKey] || [];
    all.push(...list);
    cursor = data.cursor;
    guard += 1;
  } while (cursor && guard < 100);
  return all;
}

export async function getMerchant() {
  return lvFetch('/merchant');
}

export const fetchCategories = () => paginate('/categories', 'categories');
export const fetchItems = () => paginate('/items', 'items');
export const fetchInventory = () => paginate('/inventory', 'inventory_levels');
export const fetchCustomers = () => paginate('/customers', 'customers');
