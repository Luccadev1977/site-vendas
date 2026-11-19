import { adminData } from '@/lib/admin-data';
import { AdminOverview } from '@/components/admin';
export default async function Admin() {
  return <AdminOverview {...await adminData()} />;
}
