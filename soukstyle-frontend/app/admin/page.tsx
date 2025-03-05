// app/admin/page.tsx
import { cookies } from 'next/headers';
import api from '../../lib/api';
import ClientAdminDashboard from './ClientAdminDashboard';

// Server-side data fetching
async function fetchAdminData(token: string | null) {
  if (!token) {
    return { success: false, error: 'Authentication required' };
  }

  try {
    const [shopsRes, usersRes, categoriesRes, analyticsRes] = await Promise.all([
      api.get('/admin/shops', { headers: { 'x-auth-token': token } }),
      api.get('/admin/users', { headers: { 'x-auth-token': token } }),
      api.get('/categories', { headers: { 'x-auth-token': token } }),
      api.get('/admin/analytics', { headers: { 'x-auth-token': token } }),
    ]);
    return {
      success: true,
      shops: shopsRes.data,
      users: usersRes.data,
      categories: categoriesRes.data,
      analytics: analyticsRes.data,
    };
  } catch (error: any) {
    console.error('Error fetching admin data:', error);
    return {
      success: false,
      error: error.response?.status === 429
        ? 'Too many requests. Please try again later.'
        : error.response?.data?.message || 'Failed to load admin data',
      retryAfter: error.response?.headers['retry-after'] || 0,
    };
  }
}

// Server-side component
export default async function AdminPage() {
  const cookieStore = await cookies(); // Await cookies()
  const token = cookieStore.get('token')?.value || null; // Safely access token value

  const result = await fetchAdminData(token);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <ClientAdminDashboard initialResult={result} />
    </div>
  );
}