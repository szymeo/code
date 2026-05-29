import { OS_SERVICE } from "@posthog/workspace-server/services/os/identifiers";
import type { OsService } from "@posthog/workspace-server/services/os/os";
import { container } from "../../di/container";
import {
  checkWriteAccessInput,
  claudePermissionsOutput,
  downscaleImageFileInput,
  openExternalInput,
  readFileAsDataUrlInput,
  saveClipboardFileInput,
  saveClipboardImageInput,
  saveClipboardTextInput,
  searchDirectoriesInput,
  selectAttachmentsInput,
  selectAttachmentsOutput,
  selectFilesOutput,
  showMessageBoxInput,
} from "@posthog/workspace-server/services/os/schemas";
import { publicProcedure, router } from "../trpc";

const getService = () => container.get<OsService>(OS_SERVICE);

export const osRouter = router({
  getClaudePermissions: publicProcedure
    .output(claudePermissionsOutput)
    .query(() => getService().getClaudePermissions()),

  selectDirectory: publicProcedure.query(() => getService().selectDirectory()),

  selectFiles: publicProcedure
    .output(selectFilesOutput)
    .query(() => getService().selectFiles()),

  selectAttachments: publicProcedure
    .input(selectAttachmentsInput)
    .output(selectAttachmentsOutput)
    .query(({ input }) => getService().selectAttachments(input.mode)),

  checkWriteAccess: publicProcedure
    .input(checkWriteAccessInput)
    .query(({ input }) => getService().checkWriteAccess(input.directoryPath)),

  showMessageBox: publicProcedure
    .input(showMessageBoxInput)
    .mutation(({ input }) => getService().showMessageBox(input.options)),

  openExternal: publicProcedure
    .input(openExternalInput)
    .mutation(({ input }) => getService().openExternal(input.url)),

  searchDirectories: publicProcedure
    .input(searchDirectoriesInput)
    .query(({ input }) => getService().searchDirectories(input.query)),

  getAppVersion: publicProcedure.query(() => getService().getAppVersion()),

  getWorktreeLocation: publicProcedure.query(() =>
    getService().getWorktreeLocation(),
  ),

  readFileAsDataUrl: publicProcedure
    .input(readFileAsDataUrlInput)
    .query(({ input }) =>
      getService().readFileAsDataUrl(input.filePath, input.maxSizeBytes),
    ),

  saveClipboardText: publicProcedure
    .input(saveClipboardTextInput)
    .mutation(({ input }) =>
      getService().saveClipboardText(input.text, input.originalName),
    ),

  saveClipboardImage: publicProcedure
    .input(saveClipboardImageInput)
    .mutation(({ input }) =>
      getService().saveClipboardImage(
        input.base64Data,
        input.mimeType,
        input.originalName,
      ),
    ),

  downscaleImageFile: publicProcedure
    .input(downscaleImageFileInput)
    .mutation(({ input }) => getService().downscaleImageFile(input.filePath)),

  saveClipboardFile: publicProcedure
    .input(saveClipboardFileInput)
    .mutation(({ input }) =>
      getService().saveClipboardFile(input.base64Data, input.originalName),
    ),
});
