import client from './client.js';

/**
 * Role-aware search. The backend dispatches by the user's role
 * and returns grouped results in a uniform shape:
 *
 *   {
 *     query: "physics",
 *     groups: [
 *       { id: 'books', label: 'Books', icon: '📖', items: [
 *           { id, title, subtitle, path }
 *       ]}
 *     ],
 *     total: 12
 *   }
 */
export async function search(q) {
  const { data } = await client.get(`/search?q=${encodeURIComponent(q)}`);
  return data.data;
}