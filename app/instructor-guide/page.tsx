import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import InstructorGuideContent from "@/components/guides/InstructorGuideContent";

export default function InstructorGuidePage() {
  return (
    <>
      <main className="min-h-screen pb-20 flex flex-col items-center font-sans">
        <AppHeader action="back" />
        <InstructorGuideContent />
      </main>

      <Footer />
    </>
  );
}
