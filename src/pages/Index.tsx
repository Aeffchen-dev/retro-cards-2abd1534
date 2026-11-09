import RetroCards from "@/components/RetroCards";
import { PartnerSessionProvider } from '@/hooks/use-partner-session';

const Index = () => {
  return <PartnerSessionProvider><RetroCards /></PartnerSessionProvider>;
};

export default Index;
