export interface PromptAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: "image" | "text";
  dataUrl?: string;
  textContent?: string;
}

export interface RpcImageContent {
  type: "image";
  data: string;
  mimeType: string;
}

const TEXT_EXTENSIONS =
  /\.(txt|md|markdown|json|js|ts|tsx|jsx|css|html|htm|yaml|yml|toml|rs|py|go|sh|sql|xml|csv|env|gitignore|dockerfile)$/i;

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const isTextFile = (file: File): boolean => {
  if (file.type.startsWith("text/")) return true;
  if (
    file.type === "application/json" ||
    file.type === "application/javascript" ||
    file.type === "application/xml"
  ) {
    return true;
  }
  return TEXT_EXTENSIONS.test(file.name);
};

export const fileToAttachment = async (file: File): Promise<PromptAttachment> => {
  const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (file.type.startsWith("image/")) {
    const dataUrl = await readAsDataUrl(file);
    return {
      id,
      name: file.name || "image",
      type: file.type,
      size: file.size,
      kind: "image",
      dataUrl,
    };
  }

  if (isTextFile(file)) {
    const textContent = await file.text();
    return {
      id,
      name: file.name,
      type: file.type || "text/plain",
      size: file.size,
      kind: "text",
      textContent,
    };
  }

  throw new Error(`Unsupported file type: ${file.name}`);
};

export const filesToAttachments = async (files: File[]): Promise<PromptAttachment[]> => {
  const results = await Promise.allSettled(files.map((file) => fileToAttachment(file)));
  const attachments: PromptAttachment[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      attachments.push(result.value);
    } else {
      console.warn("[attachments]", result.reason);
    }
  }
  return attachments;
};

export const dataUrlToRpcImage = (dataUrl: string): RpcImageContent => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data URL");
  }
  return {
    type: "image",
    mimeType: match[1],
    data: match[2],
  };
};

export const attachmentsToRpcImages = (
  attachments: PromptAttachment[],
): RpcImageContent[] =>
  attachments
    .filter((attachment) => attachment.kind === "image" && attachment.dataUrl)
    .map((attachment) => dataUrlToRpcImage(attachment.dataUrl!));

export const buildPromptMessage = (
  text: string,
  attachments: PromptAttachment[],
): string => {
  const trimmed = text.trim();
  const textFiles = attachments.filter(
    (attachment) => attachment.kind === "text" && attachment.textContent !== undefined,
  );

  if (textFiles.length === 0) {
    return trimmed;
  }

  const fileBlocks = textFiles
    .map(
      (file) =>
        `[Attached file: ${file.name}]\n\`\`\`\n${file.textContent}\n\`\`\``,
    )
    .join("\n\n");

  return trimmed ? `${trimmed}\n\n${fileBlocks}` : fileBlocks;
};

export const canSendWithAttachments = (
  text: string,
  attachments: PromptAttachment[],
): boolean => {
  if (text.trim().length > 0) return true;
  if (attachments.some((attachment) => attachment.kind === "image")) return true;
  if (attachments.some((attachment) => attachment.kind === "text")) return true;
  return false;
};
