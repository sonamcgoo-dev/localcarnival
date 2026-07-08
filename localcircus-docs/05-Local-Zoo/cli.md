# Local Zoo CLI

> Command-line interface for artifact discovery and management.

## Commands

### circus zoo search

Search for artifacts.

```bash
circus zoo search <query> [options]

Options:
  --category, -c    Filter by category
  --capability      Filter by capability
  --verified        Only verified
  --limit, -l       Max results (default: 20)
```

### circus zoo list

List artifacts by category.

```bash
circus zoo list [options]

Options:
  --category, -c    Category to list
  --sort            Sort: recent|downloads|rating|name
```

### circus zoo show

Show artifact details.

```bash
circus zoo show <artifact-id> [options]

Options:
  --versions        Show all versions
  --dependencies   Show dependencies
  --benchmarks     Show benchmarks
```

### circus zoo install

Install an artifact.

```bash
circus zoo install <artifact-id>[@version] [options]

Options:
  --version, -v     Specific version (default: latest)
  --force           Reinstall if installed
  --deps            Include dependencies (default: true)
```

### circus zoo update

Update installed artifacts.

```bash
circus zoo update [artifact-id] [options]

Options:
  --check           Check for updates only
```

### circus zoo uninstall

Uninstall an artifact.

```bash
circus zoo uninstall <artifact-id>
```

### circus zoo list-installed

List installed artifacts.

```bash
circus zoo list-installed [options]

Options:
  --outdated        Only show outdated
  --format          Output: table|json|yaml
```

### circus zoo collection

Manage collections.

```bash
circus zoo collection <subcommand>

Subcommands:
  list                      List collections
  create <name>             Create collection
  add <artifact-id> -c <name>   Add to collection
  remove <artifact-id> -c <name> Remove from collection
```

### circus zoo compare

Compare artifacts.

```bash
circus zoo compare <artifact-id-1> [artifact-id-2]
```

### circus zoo info

Show artifact DNA.

```bash
circus zoo info <artifact-id>
```

## Global Options

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |
| `--quiet`, `-q` | Minimal output |
| `--verbose`, `-v` | Detailed output |
| `--registry` | Use specific registry |
