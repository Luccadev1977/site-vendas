import { adminData } from '@/lib/admin-data';
import { AdminOverview } from '@/components/admin';
export default async function Financial() {
  return <AdminOverview {...await adminData()} financial />;
}
