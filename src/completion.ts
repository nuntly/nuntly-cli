const COMMANDS = [
	"login",
	"profiles",
	"completion",
	"emails",
	"domains",
	"webhooks",
	"organizations",
	"inboxes",
	"agents",
	"threads",
	"messages",
	"namespaces",
	"api-keys",
];

// Flags accepted on any command (kept in sync with the global options
// declared in src/index.ts and the per-command options emitted by the
// generator). Fake flags like `--json` / `--yaml` were dropped: the real
// switch is `--format <fmt>`, the others are shorthands.
const GLOBAL_FLAGS = [
	"--format",
	"--raw",
	"--quiet",
	"-q",
	"--fields",
	"--no-header",
	"--profile",
	"--api-key",
	"--yes",
	"-y",
	"--help",
];

const SUBCOMMANDS: Record<string, string[]> = {
	emails: [
		"send",
		"list",
		"retrieve",
		"cancel",
		"stats",
		"events",
		"content",
		"bulk",
	],
	domains: ["create", "list", "retrieve", "update", "delete"],
	webhooks: ["create", "list", "retrieve", "update", "delete", "events"],
	organizations: ["list", "retrieve", "usage"],
	inboxes: [
		"create",
		"list",
		"retrieve",
		"update",
		"delete",
		"threads",
		"messages",
	],
	agents: ["memory"],
	threads: ["retrieve", "update", "messages"],
	messages: ["list", "retrieve", "reply", "forward", "content", "attachments"],
	namespaces: ["create", "list", "retrieve", "update", "delete", "inboxes"],
	"api-keys": ["create", "list", "retrieve", "update", "delete"],
};

export function bashCompletion(): string {
	return `#!/bin/bash
_nuntly_completions() {
  local cur prev commands
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  commands="${COMMANDS.join(" ")}"

  case "\${COMP_CWORD}" in
    1)
      COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
      ;;
    2)
      case "\${prev}" in
${Object.entries(SUBCOMMANDS)
	.map(
		([cmd, subs]) =>
			`        ${cmd}) COMPREPLY=( $(compgen -W "${subs.join(" ")}" -- "\${cur}") ) ;;`,
	)
	.join("\n")}
        *) ;;
      esac
      ;;
    *)
      COMPREPLY=( $(compgen -W "${GLOBAL_FLAGS.join(" ")}" -- "\${cur}") )
      ;;
  esac
}
complete -F _nuntly_completions nuntly`;
}

export function zshCompletion(): string {
	return `#compdef nuntly

_nuntly() {
  local -a commands
  commands=(
${COMMANDS.map((c) => `    '${c}:${c} command'`).join("\n")}
  )

  _arguments -C \\
    '1:command:->command' \\
    '*::arg:->args'

  case $state in
    command)
      _describe 'command' commands
      ;;
    args)
      case $words[1] in
${Object.entries(SUBCOMMANDS)
	.map(
		([cmd, subs]) =>
			`        ${cmd}) _values 'subcommand' ${subs.map((s) => `'${s}'`).join(" ")} ;;`,
	)
	.join("\n")}
      esac
      ;;
  esac
}

_nuntly`;
}

export function fishCompletion(): string {
	const lines = COMMANDS.map(
		(c) => `complete -c nuntly -n '__fish_use_subcommand' -a '${c}'`,
	);
	for (const [cmd, subs] of Object.entries(SUBCOMMANDS)) {
		for (const sub of subs) {
			lines.push(
				`complete -c nuntly -n '__fish_seen_subcommand_from ${cmd}' -a '${sub}'`,
			);
		}
	}
	return lines.join("\n");
}

export function powershellCompletion(): string {
	const subBlocks = Object.entries(SUBCOMMANDS)
		.map(
			([cmd, subs]) =>
				`        '${cmd}' { @(${subs.map((s) => `'${s}'`).join(", ")}) | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) } }`,
		)
		.join("\n");

	return `Register-ArgumentCompleter -CommandName nuntly -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)
    $elements = $commandAst.CommandElements
    if ($elements.Count -le 2) {
        @(${COMMANDS.map((c) => `'${c}'`).join(", ")}) | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
    } else {
        $cmd = $elements[1].ToString()
        switch ($cmd) {
${subBlocks}
        }
    }
}`;
}
