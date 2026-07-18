import { Typography } from '@/components/ui';
import { WidgetFlowShell } from '@/features/chat-widget';

export default function Screen() {
  return (
    <WidgetFlowShell
      pageTitle="Add chat widget"
      subtitle="Configure the widget in steps. Advanced preview is on web."
      cardTitle="Choose widget type"
      currentStep={0}
    >
      <Typography variant="medium">
        Start with chat widget setup on web for full sandbox preview, or continue on mobile for basic publish controls after creation.
      </Typography>
    </WidgetFlowShell>
  );
}
