import client from './client.js';

export async function getNotifications() {
  const { data } = await client.get('/notifications');
  return data.data;
}