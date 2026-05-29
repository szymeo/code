import { PendingChatView } from "@features/sessions/components/PendingChatView";
import { Box } from "@radix-ui/themes";
import { usePendingTaskPrompt } from "@posthog/ui/workbench/pendingTaskPromptStore";

interface TaskPendingViewProps {
  pendingTaskKey: string;
}

export function TaskPendingView({ pendingTaskKey }: TaskPendingViewProps) {
  const pending = usePendingTaskPrompt(pendingTaskKey);

  return (
    <Box className="relative h-full w-full bg-background">
      <PendingChatView
        promptText={pending?.promptText ?? ""}
        attachments={pending?.attachments}
      />
    </Box>
  );
}
