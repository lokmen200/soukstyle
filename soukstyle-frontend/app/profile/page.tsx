// app/profile/page.tsx
import api from '../../lib/api';
import ClientProfile from './ClientProfile';
import { headers } from 'next/headers';

async function fetchInitialOrders(token: string) {
  try {
    const response = await api.get('/orders/me', { headers: { 'x-auth-token': token } });
    return response.data;
  } catch (error) {
    console.error('Error fetching initial orders:', error);
    return [];
  }
}

export default async function ProfilePage() {
  const headersList = await headers(); // Await headers()
  const token = headersList.get('x-auth-token') || '';
  const initialTab = headersList.get('x-initial-tab') || 'profile'; // Default to 'profile'
  const initialOrders = token ? await fetchInitialOrders(token) : [];

  return (
    <ClientProfile initialTab={initialTab} initialOrders={initialOrders} />
  );
}