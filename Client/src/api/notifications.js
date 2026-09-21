import client from './client.js';

export async function getNotifications() {
  const { data } = await client.get('/notifications');
  return data.data;
}

export async function getMyNotices() {
  const { data } = await client.get('/notifications/notices');
  return data.data;
}

export async function getMyNotice(noticeId) {
  const { data } = await client.get(`/notifications/notices/${noticeId}`);
  return data.data;
}