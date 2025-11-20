# Versioning and Publishing Guide

This project uses [semantic versioning](https://semver.org/) with [standard-version](https://github.com/conventional-changelog/standard-version) for automated version management.

## Semantic Versioning

Version numbers follow the format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes that are incompatible with previous versions
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes that are backward compatible

## Commit Message Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. Your commit messages should follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `perf`: A performance improvement
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `chore`: Maintenance tasks
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes

### Examples

```bash
feat: add support for custom swiper colors
fix: resolve map synchronization issue on zoom
docs: update installation instructions
perf: optimize map rendering performance
```

## Local Versioning

### Automatic Version Bump

Standard-version will automatically determine the version bump based on your commit messages:

```bash
npm run version
```

This will:
1. Analyze commit messages since the last release
2. Determine the appropriate version bump (patch/minor/major)
3. Update `package.json` version
4. Generate/update `CHANGELOG.md`
5. Create a git tag
6. Create a commit with the version bump

### Manual Version Bump

You can also specify the version type explicitly:

```bash
# Patch version (1.0.0 -> 1.0.1)
npm run version:patch

# Minor version (1.0.0 -> 1.1.0)
npm run version:minor

# Major version (1.0.0 -> 2.0.0)
npm run version:major
```

### Complete Release Process (Local)

To build, version, and push everything:

```bash
npm run release
```

This will:
1. Build the package
2. Bump the version (based on commits)
3. Push changes and tags to the repository

## Publishing via GitHub Actions

The project includes a GitHub Actions workflow that can be manually triggered to publish to npm.

### Prerequisites

1. **NPM Token**: You need to add an `NPM_TOKEN` secret to your GitHub repository:
   - Go to your repository settings
   - Navigate to "Secrets and variables" > "Actions"
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm access token (create one at https://www.npmjs.com/settings/YOUR_USERNAME/tokens)

2. **GitHub Token**: The `GITHUB_TOKEN` is automatically provided by GitHub Actions, so no setup needed.

### Manual Workflow Trigger

1. Go to the "Actions" tab in your GitHub repository
2. Select "Publish to NPM" workflow
3. Click "Run workflow"
4. Choose your options:
   - **Version bump type**: Select `patch`, `minor`, or `major`
   - **Skip version bump**: Check this if you want to publish the current version without bumping
5. Click "Run workflow"

### What the Workflow Does

1. ✅ Checks out the code
2. ✅ Sets up Node.js
3. ✅ Installs dependencies
4. ✅ Runs tests
5. ✅ Builds the package
6. ✅ Bumps version (if not skipped)
7. ✅ Publishes to npm
8. ✅ Pushes changes and tags to GitHub
9. ✅ Creates a GitHub release with changelog

### Publishing Current Version (No Bump)

If you want to publish the current version without creating a new version:

1. Trigger the workflow manually
2. Select any version type (it will be ignored)
3. Check "Skip version bump"
4. Run the workflow

This is useful if you need to republish a version or publish after a manual version bump.

## Best Practices

1. **Always use conventional commits**: This ensures the changelog is automatically generated correctly
2. **Test before publishing**: The workflow runs tests automatically, but test locally first
3. **Review the changelog**: After versioning, review the generated `CHANGELOG.md` before publishing
4. **Tag releases**: The workflow automatically creates git tags, but you can also create them manually if needed
5. **Use the workflow for publishing**: It ensures consistency and includes all necessary steps

## Troubleshooting

### Version Already Exists

If you try to publish a version that already exists on npm, the publish step will fail. Either:
- Bump to a new version
- Or use "Skip version bump" if you're republishing the same version

### Workflow Fails on Push

If the workflow fails when pushing tags, ensure:
- The repository has write permissions for the GitHub token
- You're pushing to the correct branch (default: `main`)

### Changelog Not Generated

If the changelog is empty or not generated:
- Ensure you have conventional commit messages since the last release
- Check that `.versionrc.json` is properly configured
- Run `npm run version` locally to test

