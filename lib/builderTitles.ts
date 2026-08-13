const PREFIX = [
  "Full-Stack",
  "Backend",
  "Frontend",
  "AI",
  "Crypto",
  "DevOps",
  "Mobile",
  "Blockchain",
  "System",
  "Data",
  "Security",
  "Cloud",
];

const SUFFIX = [
  "Ship Machine",
  "Terminal Tyrant",
  "Build Monkey",
  "Pixel Alchemist",
  "Zero-to-One Wrecker",
  "Mainnet Cowboy",
  "Latency Hunter",
  "Type-Safe Enforcer",
  "Sandstorm Rider",
  "Protocol Whisperer",
  "Deploy Ninja",
  "Rebase Rebel",
  "Commit Sommelier",
  "Arena Gladiator",
  "Midnight Coder",
  "Wifi Pirate",
];

const EXTRA = [
  "The Terminal Tyrant",
  "The Deploy Ninja",
  "The Ship Machine",
  "The Zero-to-One Wrecker",
  "The Sandstorm Rider",
];

const ROLE_KEYWORDS: Array<[RegExp, string]> = [
  [/design|ui|ux|frontend|web/i, "Frontend"],
  [/backend|api|server/i, "Backend"],
  [/blockchain|solidity|smart|web3|crypto/i, "Crypto"],
  [/ai|ml|llm|gpt|model/i, "AI"],
  [/devops|cloud|infra|k8s|kubernetes|aws/i, "DevOps"],
  [/mobile|ios|android|react native/i, "Mobile"],
  [/data|analytics/i, "Data"],
  [/security|hack|pentest/i, "Security"],
  [/full|mevn|mearn|stack/i, "Full-Stack"],
];

export function generateBuilderTitle(stackOrRole?: string): string {
  const s = (stackOrRole ?? "").trim();
  let prefix: string | undefined;

  if (s) {
    for (const [re, label] of ROLE_KEYWORDS) {
      if (re.test(s)) {
        prefix = label;
        break;
      }
    }
  }

  const suffix = SUFFIX[Math.floor(Math.random() * SUFFIX.length)];
  if (prefix) return `${prefix} ${suffix}`;

  const useExtra = Math.random() < 0.4;
  if (useExtra) return EXTRA[Math.floor(Math.random() * EXTRA.length)];

  const p = PREFIX[Math.floor(Math.random() * PREFIX.length)];
  return `${p} ${suffix}`;
}
