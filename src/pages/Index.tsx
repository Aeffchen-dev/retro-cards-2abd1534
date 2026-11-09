import RetroCards from "@/components/RetroCards";
import QuestionFontPreview from "@/components/QuestionFontPreview";
import { PartnerSessionProvider } from '@/hooks/use-partner-session';

const Index = () => {
  return <PartnerSessionProvider><RetroCards /><QuestionFontPreview /></PartnerSessionProvider>;
};

export default Index;
