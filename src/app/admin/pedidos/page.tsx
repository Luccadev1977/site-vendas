import { adminData } from '@/lib/admin-data';
import { AdminOverview } from '@/components/admin';
export default async function Orders() {
  return <AdminOverview {...await adminData()} orders />;
}
