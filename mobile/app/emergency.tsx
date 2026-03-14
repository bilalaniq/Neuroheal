import { EmergencySOSScreen } from '@/components/EmergencySOSScreen';
import { useRouter } from 'expo-router';

export default function EmergencyPage() {
    const router = useRouter();
    return <EmergencySOSScreen navigation={{ goBack: () => router.back() }} />;
}