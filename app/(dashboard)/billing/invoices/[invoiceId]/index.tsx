import { useLocalSearchParams } from 'expo-router';

import { InvoiceDetailPage } from '@/features/billing';

export default function Screen() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  return <InvoiceDetailPage invoiceId={invoiceId ?? ''} />;
}
