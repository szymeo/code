import { useOnboardingStore } from "@posthog/ui/features/onboarding/onboardingStore";
import { SettingRow } from "@features/settings/components/SettingRow";
import { useSettingsDialogStore } from "@posthog/ui/features/settings/settingsDialogStore";
import { useSettingsStore } from "@posthog/ui/features/settings/settingsStore";
import { useSetupStore } from "@posthog/ui/features/setup/setupStore";
import { useTourStore } from "@features/tour/stores/tourStore";
import { useFeatureFlag } from "@hooks/useFeatureFlag";
import { Button, Flex, Switch } from "@radix-ui/themes";
import { clearApplicationStorage } from "@utils/clearStorage";

export function AdvancedSettings() {
  const showDebugLogsToggle =
    useFeatureFlag("posthog-code-background-agent-logs") || import.meta.env.DEV;
  const debugLogsCloudRuns = useSettingsStore((s) => s.debugLogsCloudRuns);
  const setDebugLogsCloudRuns = useSettingsStore(
    (s) => s.setDebugLogsCloudRuns,
  );

  return (
    <Flex direction="column">
      <SettingRow
        label="Reset onboarding and tours"
        description="Re-run the onboarding tutorial and product tours on next app restart"
      >
        <Button
          variant="soft"
          size="1"
          onClick={() => {
            useSettingsDialogStore.getState().close();
            useOnboardingStore.getState().resetOnboarding();
            useSetupStore.getState().resetSetup();
            useTourStore.getState().resetTours();
          }}
        >
          Reset
        </Button>
      </SettingRow>
      <SettingRow
        label="Clear application storage"
        description="This will remove all locally stored application data"
        noBorder={!showDebugLogsToggle}
      >
        <Button
          variant="soft"
          color="red"
          size="1"
          onClick={clearApplicationStorage}
        >
          Clear all data
        </Button>
      </SettingRow>
      {showDebugLogsToggle && (
        <SettingRow
          label="Debug logs for cloud runs"
          description="Show debug-level console output in the conversation view for cloud-executed runs"
          noBorder
        >
          <Switch
            checked={debugLogsCloudRuns}
            onCheckedChange={setDebugLogsCloudRuns}
            size="1"
          />
        </SettingRow>
      )}
    </Flex>
  );
}
