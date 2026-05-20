import { useDevFlagsStore } from "@features/dev-toolbar/devFlagsStore";
import { useOnboardingStore } from "@features/onboarding/stores/onboardingStore";
import { SettingRow } from "@features/settings/components/SettingRow";
import { useSettingsDialogStore } from "@features/settings/stores/settingsDialogStore";
import { useSettingsStore } from "@features/settings/stores/settingsStore";
import { useSetupStore } from "@features/setup/stores/setupStore";
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
  const devMode = useDevFlagsStore((s) => s.devMode);
  const setDevMode = useDevFlagsStore((s) => s.setDevMode);

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
        >
          <Switch
            checked={debugLogsCloudRuns}
            onCheckedChange={setDebugLogsCloudRuns}
            size="1"
          />
        </SettingRow>
      )}
      <SettingRow
        label="Developer mode"
        description="Show the dev toolbar with live CPU, memory, IPC timings and render tracking"
        noBorder
      >
        <Switch
          checked={devMode}
          onCheckedChange={(checked) => {
            void setDevMode(checked);
          }}
          size="1"
        />
      </SettingRow>
    </Flex>
  );
}
